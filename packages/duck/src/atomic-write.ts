import {
  CancellationReason,
  ConditionCheck,
  Delete,
  DynamoDBClient,
  Put,
  TransactionCanceledException,
  TransactWriteItem,
  TransactWriteItemsCommand,
  TransactWriteItemsCommandInput,
  Update,
} from '@aws-sdk/client-dynamodb';

import { compile, SerializableInput } from '@onia/dino';

import { hash } from './helpers';

export interface AtomicWriteOptions {
  onError?: (reason: CancellationReason) => void | Promise<void>;
}

export interface AtomicWriteInput extends AtomicWriteOptions {
  item: TransactWriteItem;
}

export class AtomicWrite {
  /**
   * The transaction max size.
   */
  private static readonly MAX_SIZE = 25;

  /**
   * The transaction items.
   */
  private readonly $inputs: AtomicWriteInput[] = [];

  /**
   * The transaction token.
   */
  private $token: string | undefined;

  /**
   * Create a new atomic write.
   */
  constructor(private readonly $client: DynamoDBClient) {}

  /**
   * Set the transaction token.
   */
  token(token: string): AtomicWrite {
    this.$token = hash(token);

    return this;
  }

  /**
   * Add a PUT instruction to the transaction.
   */
  put(
    input: SerializableInput<Put>,
    options?: AtomicWriteOptions
  ): AtomicWrite {
    this.$inputs.push({ item: { Put: compile(input) }, ...options });

    return this;
  }

  /**
   * Add a UPDATE instruction to the transaction.
   */
  update(
    input: SerializableInput<Update>,
    options?: AtomicWriteOptions
  ): AtomicWrite {
    this.$inputs.push({ item: { Update: compile(input) }, ...options });

    return this;
  }

  /**
   * Add a DELETE instruction to the transaction.
   */
  delete(
    input: SerializableInput<Delete>,
    options?: AtomicWriteOptions
  ): AtomicWrite {
    this.$inputs.push({ item: { Delete: compile(input) }, ...options });

    return this;
  }

  /**
   * Add a CONDITION instruction to the transaction.
   */
  condition(
    input: SerializableInput<ConditionCheck>,
    options?: AtomicWriteOptions
  ): AtomicWrite {
    this.$inputs.push({ item: { ConditionCheck: compile(input) }, ...options });

    return this;
  }

  /**
   * Commit the transaction.
   */
  async commit(): Promise<void> {
    if (this.$inputs.length === 0) {
      return;
    }

    if (this.$inputs.length > AtomicWrite.MAX_SIZE) {
      throw new Error('Collection size limit exceeded');
    }

    const inputs = [...this.$inputs].map((input) => input.item);

    const input: TransactWriteItemsCommandInput = {
      TransactItems: inputs,
    };

    if (this.$token) {
      input.ClientRequestToken = this.$token;
    }

    try {
      await this.$client.send(new TransactWriteItemsCommand(input));
    } catch (error) {
      if (error instanceof TransactionCanceledException) {
        const reasons = error.CancellationReasons;

        if (!reasons) {
          throw error;
        }

        for (const [reasonIndex, reason] of reasons.entries()) {
          if (!reason.Code) {
            continue;
          }

          const input = this.$inputs[reasonIndex];

          if (input?.onError) {
            await input.onError(reason);
          }
        }
      }

      throw error;
    }
  }
}
