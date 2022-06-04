import {
  AttributeValue,
  BatchWriteItemCommand,
  DeleteItemCommand,
  DescribeTableCommand,
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  ScanCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

const client = new DynamoDBClient({});

export class DynamoTable {
  /**
   * Create a new dynamo table.
   */
  constructor(private $table: string) {}

  /**
   * Set up the dynamo table.
   */
  async setup(): Promise<void> {
    //
  }

  /**
   * Tear down the dynamo table.
   */
  async teardown(): Promise<void> {
    await this.deleteItems();
  }

  /**
   * Create an item.
   */
  async createItem(attributes: Record<string, string>): Promise<void> {
    await client.send(
      new PutItemCommand({
        TableName: this.$table,
        Item: marshall(attributes),
      })
    );
  }

  /**
   * Delete an item.
   */
  async deleteItem(keys: Record<string, string>): Promise<void> {
    await client.send(
      new DeleteItemCommand({
        TableName: this.$table,
        Key: marshall(keys),
      })
    );
  }

  /**
   * Delete all items.
   */
  async deleteItems(): Promise<void> {
    const describeResult = await client.send(
      new DescribeTableCommand({
        TableName: this.$table,
      })
    );

    if (!describeResult?.Table?.KeySchema) {
      throw new Error('Missing table key schema');
    }

    let lastKeys: Record<string, AttributeValue> | undefined;

    const tableKeys = describeResult.Table.KeySchema.map(
      (key) => key.AttributeName
    ) as string[];

    do {
      const scanResult = await client.send(
        new ScanCommand({
          TableName: this.$table,
          AttributesToGet: tableKeys,
          ExclusiveStartKey: lastKeys,
          Limit: 25,
        })
      );

      if (!scanResult?.Items) {
        break;
      }

      await client.send(
        new BatchWriteItemCommand({
          RequestItems: {
            [this.$table]: scanResult.Items.map((key) => ({
              DeleteRequest: { Key: key },
            })),
          },
        })
      );

      lastKeys = scanResult.LastEvaluatedKey;
    } while (lastKeys);
  }

  /**
   * Determine if an item exists.
   */
  async containsItem(
    keys: Record<string, string>,
    attributes?: Record<string, string>
  ): Promise<boolean> {
    try {
      const result = await client.send(
        new GetItemCommand({
          TableName: this.$table,
          Key: marshall(keys),
        })
      );

      if (!result?.Item) {
        return false;
      }

      if (!attributes) {
        return true;
      }

      const item = unmarshall(result.Item);

      for (const [name, value] of Object.entries(attributes)) {
        const attribute = item[name];

        if (!attribute || attribute !== value) {
          return false;
        }
      }
    } catch {
      return false;
    }

    return true;
  }
}
