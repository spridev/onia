import {
  DeleteItemCommand,
  DeleteItemCommandInput,
  DynamoDBClient,
  GetItemCommand,
  GetItemCommandInput,
  PutItemCommand,
  PutItemCommandInput,
  QueryCommand,
  QueryCommandInput,
  QueryCommandOutput,
  ScanCommand,
  ScanCommandInput,
  ScanCommandOutput,
  UpdateItemCommand,
  UpdateItemCommandInput,
} from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';

import { compile } from '@onia/dino';

import { TableInput } from './table-input';

export class Table {
  /**
   * The table name.
   */
  public readonly name: string;

  /**
   * The DynamoDB client.
   */
  private readonly $client: DynamoDBClient;

  /**
   * Create a new table.
   */
  constructor(client: DynamoDBClient, name: string | undefined) {
    if (!name) {
      throw new Error('Missing table name');
    }

    this.name = name;
    this.$client = client;
  }

  /**
   * Get an item.
   */
  async get<T extends object>(
    input: TableInput<GetItemCommandInput>
  ): Promise<T | undefined> {
    const output = await this.$client.send(
      new GetItemCommand(
        compile<GetItemCommandInput>({ TableName: this.name, ...input })
      )
    );

    if (!output.Item) {
      return undefined;
    }

    return unmarshall(output.Item) as T;
  }

  /**
   * Create an item.
   */
  async put<T extends object>(
    input: TableInput<PutItemCommandInput>
  ): Promise<Partial<T>> {
    const output = await this.$client.send(
      new PutItemCommand(
        compile<PutItemCommandInput>({ TableName: this.name, ...input })
      )
    );

    if (!output.Attributes) {
      return {};
    }

    return unmarshall(output.Attributes) as Partial<T>;
  }

  /**
   * Update an item.
   */
  async update<T extends object>(
    input: TableInput<UpdateItemCommandInput>
  ): Promise<Partial<T>> {
    const output = await this.$client.send(
      new UpdateItemCommand(
        compile<UpdateItemCommandInput>({ TableName: this.name, ...input })
      )
    );

    if (!output.Attributes) {
      return {};
    }

    return unmarshall(output.Attributes) as Partial<T>;
  }

  /**
   * Delete an item.
   */
  async delete<T extends object>(
    input: TableInput<DeleteItemCommandInput>
  ): Promise<Partial<T>> {
    const output = await this.$client.send(
      new DeleteItemCommand(
        compile<DeleteItemCommandInput>({ TableName: this.name, ...input })
      )
    );

    if (!output.Attributes) {
      return {};
    }

    return unmarshall(output.Attributes) as Partial<T>;
  }

  /**
   * Scan the table items.
   */
  async *scan<T extends object>(
    input: TableInput<ScanCommandInput> = {}
  ): AsyncGenerator<T> {
    let nextKey: ScanCommandOutput['LastEvaluatedKey'] | undefined;

    do {
      if (nextKey) {
        input.ExclusiveStartKey = nextKey;
      }

      const output = await this.$client.send(
        new ScanCommand(
          compile<ScanCommandInput>({ TableName: this.name, ...input })
        )
      );

      if (output.Items) {
        for (const item of output.Items) {
          yield unmarshall(item) as T;
        }
      }

      nextKey = output.LastEvaluatedKey;
    } while (nextKey);
  }

  /**
   * Query the table items.
   */
  async *query<T extends object>(
    input: TableInput<QueryCommandInput> = {}
  ): AsyncGenerator<T> {
    let nextKey: QueryCommandOutput['LastEvaluatedKey'] | undefined;

    do {
      if (nextKey) {
        input.ExclusiveStartKey = nextKey;
      }

      const output = await this.$client.send(
        new QueryCommand(
          compile<QueryCommandInput>({ TableName: this.name, ...input })
        )
      );

      if (output.Items) {
        for (const item of output.Items) {
          yield unmarshall(item) as T;
        }
      }

      nextKey = output.LastEvaluatedKey;
    } while (nextKey);
  }
}
