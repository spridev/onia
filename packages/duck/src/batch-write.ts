import {
  BatchWriteItemCommand,
  BatchWriteItemCommandInput,
  DeleteRequest,
  DynamoDBClient,
  PutRequest,
  WriteRequest,
} from '@aws-sdk/client-dynamodb';

import { sleep } from './helpers';

export interface BatchWriteInput {
  table: string;
  item: WriteRequest;
}

export class BatchWrite {
  /**
   * The batch max size.
   */
  private static readonly BATCH_SIZE = 25;

  /**
   * The batch items.
   */
  private readonly $inputs: BatchWriteInput[] = [];

  /**
   * Create a new batch write.
   */
  constructor(private readonly $client: DynamoDBClient) {}

  /**
   * Add a PUT instruction to the batch.
   */
  put(table: string, request: PutRequest): BatchWrite {
    this.$inputs.push({ table, item: { PutRequest: request } });

    return this;
  }

  /**
   * Add a DELETE instruction to the batch.
   */
  delete(table: string, request: DeleteRequest): BatchWrite {
    this.$inputs.push({ table, item: { DeleteRequest: request } });

    return this;
  }

  /**
   * Execute the batch write.
   */
  async exec(): Promise<void> {
    let retries = 0;
    let unprocessed = [...this.$inputs];

    while (unprocessed.length > 0) {
      const batches: BatchWriteItemCommandInput[] = [];

      for (
        let index = 0;
        index < unprocessed.length;
        index += BatchWrite.BATCH_SIZE
      ) {
        const items: Record<string, WriteRequest[]> = {};

        const inputs = unprocessed.slice(index, index + BatchWrite.BATCH_SIZE);

        for (const input of inputs) {
          if (!items[input.table]) {
            items[input.table] = [];
          }

          items[input.table].push(input.item);
        }

        batches.push({ RequestItems: items });
      }

      unprocessed = [];

      const outputs = await Promise.all(
        batches.map((batch) => {
          return this.$client.send(new BatchWriteItemCommand(batch));
        })
      );

      for (const output of outputs) {
        if (!output.UnprocessedItems) {
          continue;
        }

        for (const [table, items] of Object.entries(output.UnprocessedItems)) {
          for (const item of items) {
            unprocessed.push({ table, item });
          }
        }
      }

      await sleep(2 ** ++retries * 100);
    }
  }
}
