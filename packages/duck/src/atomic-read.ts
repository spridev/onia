import {
  DynamoDBClient,
  Get,
  TransactGetItem,
  TransactGetItemsCommand,
} from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';

import { compile, SerializableInput } from '@onia/dino';

export interface AtomicReadInput {
  item: TransactGetItem;
}

export class AtomicRead {
  /**
   * The transaction max size.
   */
  private static readonly MAX_SIZE = 25;

  /**
   * The transaction items.
   */
  private readonly $inputs: AtomicReadInput[] = [];

  /**
   * Create a new atomic read.
   */
  constructor(private readonly $client: DynamoDBClient) {}

  /**
   * Add a GET instruction to the transaction.
   */
  get(input: SerializableInput<Get>): AtomicRead {
    this.$inputs.push({ item: { Get: compile(input) } });

    return this;
  }

  /**
   * Commit the transaction.
   */
  async commit<T extends object>(): Promise<T[]> {
    if (this.$inputs.length === 0) {
      return [];
    }

    if (this.$inputs.length > AtomicRead.MAX_SIZE) {
      throw new Error('Collection size limit exceeded');
    }

    const inputs = [...this.$inputs].map((input) => input.item);

    const output = await this.$client.send(
      new TransactGetItemsCommand({
        TransactItems: inputs,
      })
    );

    if (!output.Responses) {
      return [];
    }

    return output.Responses.map(
      (response) => response.Item && unmarshall(response.Item)
    ) as T[];
  }
}
