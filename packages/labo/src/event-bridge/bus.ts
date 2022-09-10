import {
  DeleteRuleCommand,
  EventBridgeClient,
  PutEventsCommand,
  PutRuleCommand,
  PutTargetsCommand,
  RemoveTargetsCommand,
} from '@aws-sdk/client-eventbridge';
import {
  CreateQueueCommand,
  DeleteMessageBatchCommand,
  DeleteQueueCommand,
  PurgeQueueCommand,
  ReceiveMessageCommand,
  SQSClient,
  SetQueueAttributesCommand,
} from '@aws-sdk/client-sqs';

import { nanoid } from 'nanoid';

import { Hooks } from '../hooks';

import { EventBridgeEvent } from './event';

const ebc = new EventBridgeClient({});
const sqs = new SQSClient({});

export class EventBridgeBus implements Hooks {
  /**
   * The maximum number of messages to receive.
   */
  private static readonly RECEIVE_LIMIT = 10;

  /**
   * The duration to wait for messages to be received.
   */
  private static readonly RECEIVE_WAIT_TIME = 5;

  /**
   * The name of the event bridge rule.
   */
  private readonly $ruleName: string;

  /**
   * The target of the event bridge rule.
   */
  private readonly $ruleTarget: string;

  /**
   * The name of the sqs queue.
   */
  private readonly $queueName: string;

  /**
   * The arn of the sqs queue.
   */
  private $queueArn: string | undefined;

  /**
   * The url of the sqs queue.
   */
  private $queueUrl: string | undefined;

  /**
   * Create and set up a new event bridge bus.
   */
  static async init(name: string): Promise<EventBridgeBus> {
    const bus = new EventBridgeBus(name);
    await bus.setup();

    return bus;
  }

  /**
   * Create a new event bridge bus.
   */
  constructor(private $name: string) {
    const id = nanoid();

    this.$ruleName = `${$name}-test-rule-${id}`;
    this.$ruleTarget = `${$name}-test-target-${id}`;
    this.$queueName = `${$name}-test-queue-${id}`;
  }

  /**
   * Set up the event bridge bus.
   */
  async setup(): Promise<void> {
    const output = await sqs.send(
      new CreateQueueCommand({
        QueueName: this.$queueName,
      })
    );

    if (!output?.QueueUrl) {
      throw new Error('Missing queue url');
    }

    this.$queueUrl = output.QueueUrl;

    const region = this.$queueUrl.split('.')[1];
    const account = this.$queueUrl.split('/')[3];

    this.$queueArn = `arn:aws:sqs:${region}:${account}:${this.$queueName}`;

    const pattern = { account: [account] };

    await ebc.send(
      new PutRuleCommand({
        Name: this.$ruleName,
        EventBusName: this.$name,
        EventPattern: JSON.stringify(pattern),
      })
    );

    await ebc.send(
      new PutTargetsCommand({
        Rule: this.$ruleName,
        EventBusName: this.$name,
        Targets: [{ Id: this.$ruleTarget, Arn: this.$queueArn }],
      })
    );

    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Action: 'SQS:SendMessage',
          Resource: this.$queueArn,
          Principal: {
            Service: 'events.amazonaws.com',
          },
        },
      ],
    };

    await sqs.send(
      new SetQueueAttributesCommand({
        QueueUrl: this.$queueUrl,
        Attributes: {
          Policy: JSON.stringify(policy),
        },
      })
    );
  }

  /**
   * Clean up the event bridge bus.
   */
  async cleanup(): Promise<void> {
    await this.deleteEvents();
  }

  /**
   * Tear down the event bridge bus.
   */
  async teardown(): Promise<void> {
    await ebc.send(
      new RemoveTargetsCommand({
        Ids: [this.$ruleTarget],
        Rule: this.$ruleName,
        EventBusName: this.$name,
      })
    );

    await ebc.send(
      new DeleteRuleCommand({
        Name: this.$ruleName,
        EventBusName: this.$name,
      })
    );

    await sqs.send(
      new DeleteQueueCommand({
        QueueUrl: this.$queueUrl,
      })
    );
  }

  /**
   * Create an event.
   */
  async createEvent(
    source: string,
    detailType: string,
    detail: Record<string, any>
  ): Promise<void> {
    await ebc.send(
      new PutEventsCommand({
        Entries: [
          {
            Source: source,
            Detail: JSON.stringify(detail),
            DetailType: detailType,
            EventBusName: this.$name,
          },
        ],
      })
    );
  }

  /**
   * Get all events.
   */
  async getEvents(): Promise<EventBridgeEvent[]> {
    const events: EventBridgeEvent[] = [];

    while (true) {
      const output = await sqs.send(
        new ReceiveMessageCommand({
          QueueUrl: this.$queueUrl,
          MaxNumberOfMessages: EventBridgeBus.RECEIVE_LIMIT,
          WaitTimeSeconds: EventBridgeBus.RECEIVE_WAIT_TIME,
        })
      );

      if (!output?.Messages || output.Messages.length === 0) {
        break;
      }

      await sqs.send(
        new DeleteMessageBatchCommand({
          QueueUrl: this.$queueUrl,
          Entries: output.Messages.map((message) => ({
            Id: message.MessageId,
            ReceiptHandle: message.ReceiptHandle,
          })),
        })
      );

      events.push(
        ...output.Messages.map((message) => {
          const event = JSON.parse(String(message.Body));

          return {
            id: event.id,
            time: event.time,
            source: event.source,
            detail: event.detail,
            detailType: event['detail-type'],
            resources: event.resources,
          };
        })
      );
    }

    return events;
  }

  /**
   * Purge all events.
   */
  async purgeEvents(): Promise<void> {
    await sqs.send(
      new PurgeQueueCommand({
        QueueUrl: this.$queueUrl,
      })
    );
  }

  /**
   * Delete all events.
   */
  async deleteEvents(): Promise<void> {
    while (true) {
      const output = await sqs.send(
        new ReceiveMessageCommand({
          QueueUrl: this.$queueUrl,
          MaxNumberOfMessages: EventBridgeBus.RECEIVE_LIMIT,
          WaitTimeSeconds: EventBridgeBus.RECEIVE_WAIT_TIME,
        })
      );

      if (!output?.Messages || output.Messages.length === 0) {
        break;
      }

      await sqs.send(
        new DeleteMessageBatchCommand({
          QueueUrl: this.$queueUrl,
          Entries: output.Messages.map((message) => ({
            Id: message.MessageId,
            ReceiptHandle: message.ReceiptHandle,
          })),
        })
      );
    }
  }
}
