import anyTest, { TestFn } from 'ava';

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
  SetQueueAttributesCommand,
  SQSClient,
} from '@aws-sdk/client-sqs';

import { ClientMock, ClientType } from '@onia/mock';

import { EventBridgeBus } from '../../src';

interface TestContext {
  ebc: ClientType<EventBridgeClient>;
  sqs: ClientType<SQSClient>;
}

const test = anyTest as TestFn<TestContext>;

test.beforeEach(function (t) {
  t.context.ebc = new ClientMock(EventBridgeClient);
  t.context.sqs = new ClientMock(SQSClient);
});

test.afterEach.always(function (t) {
  t.context.ebc.restore();
  t.context.sqs.restore();
});

test('sets up the bus', async function (t) {
  const { ebc, sqs } = t.context;

  sqs.on(CreateQueueCommand).resolves({ QueueUrl: 'url' });
  sqs.on(SetQueueAttributesCommand).resolves({});

  ebc.on(PutRuleCommand).resolves({});
  ebc.on(PutTargetsCommand).resolves({});

  const bus = new EventBridgeBus('bus');

  await bus.setup();

  t.is(ebc.count(), 2);
  t.is(sqs.count(), 2);

  t.like(ebc.call(0), { EventBusName: 'bus' });
  t.like(ebc.call(1), { EventBusName: 'bus' });

  t.like(sqs.call(1), { QueueUrl: 'url' });
});

test('tears down the bus', async function (t) {
  const { ebc, sqs } = t.context;

  ebc.on(RemoveTargetsCommand).resolves({});
  ebc.on(DeleteRuleCommand).resolves({});

  sqs.on(DeleteQueueCommand).resolves({});

  const bus = new EventBridgeBus('bus');

  bus['queueUrl'] = 'url';

  await bus.teardown();

  t.is(ebc.count(), 2);
  t.is(sqs.count(), 1);

  t.like(ebc.call(0), { EventBusName: 'bus' });
  t.like(ebc.call(1), { EventBusName: 'bus' });

  t.like(sqs.call(0), { QueueUrl: 'url' });
});

test('creates an event', async function (t) {
  const { ebc } = t.context;

  ebc.on(PutEventsCommand).resolves({});

  const bus = new EventBridgeBus('bus');

  await bus.createEvent('source', 'type', { name: 'spri' });

  t.is(ebc.count(), 1);

  t.like(ebc.call(0), {
    Entries: [
      {
        Source: 'source',
        Detail: '{"name":"spri"}',
        DetailType: 'type',
        EventBusName: 'bus',
      },
    ],
  });
});

test('gets all events', async function (t) {
  const { sqs } = t.context;

  sqs
    .on(ReceiveMessageCommand)
    .onCall(0)
    .resolves({
      Messages: [
        { MessageId: '1', ReceiptHandle: '1', Body: '{"id":"1"}' },
        { MessageId: '2', ReceiptHandle: '2', Body: '{"id":"2"}' },
      ],
    })
    .onCall(1)
    .resolves({
      Messages: [{ MessageId: '3', ReceiptHandle: '3', Body: '{"id":"3"}' }],
    })
    .onCall(2)
    .resolves({
      Messages: [],
    });

  sqs.on(DeleteMessageBatchCommand).resolves({});

  const bus = new EventBridgeBus('bus');

  const events = await bus.getEvents();

  t.like(events[0], { id: '1' });
  t.like(events[1], { id: '2' });
  t.like(events[2], { id: '3' });

  t.is(sqs.count(), 5);

  t.like(sqs.call(1), {
    Entries: [
      { Id: '1', ReceiptHandle: '1' },
      { Id: '2', ReceiptHandle: '2' },
    ],
  });

  t.like(sqs.call(3), {
    Entries: [{ Id: '3', ReceiptHandle: '3' }],
  });
});

test('purges all events', async function (t) {
  const { sqs } = t.context;

  sqs.on(PurgeQueueCommand).resolves({});

  const bus = new EventBridgeBus('bus');

  bus['queueUrl'] = 'url';

  await bus.purgeEvents();

  t.is(sqs.count(), 1);

  t.like(sqs.call(0), {
    QueueUrl: 'url',
  });
});

test('deletes all events', async function (t) {
  const { sqs } = t.context;

  sqs
    .on(ReceiveMessageCommand)
    .onCall(0)
    .resolves({
      Messages: [
        { MessageId: '1', ReceiptHandle: '1' },
        { MessageId: '2', ReceiptHandle: '2' },
      ],
    })
    .onCall(1)
    .resolves({
      Messages: [],
    });

  sqs.on(DeleteMessageBatchCommand).resolves({});

  const bus = new EventBridgeBus('bus');

  await bus.deleteEvents();

  t.is(sqs.count(), 3);

  t.like(sqs.call(1), {
    Entries: [
      { Id: '1', ReceiptHandle: '1' },
      { Id: '2', ReceiptHandle: '2' },
    ],
  });
});
