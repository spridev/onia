import {
  AttributeValue,
  BatchWriteItemCommand,
  DeleteItemCommand,
  DescribeTableCommand,
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  ScanCommand,
  ScanCommandInput,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

const client = new DynamoDBClient({});

export class DynamoTable {
  /**
   * The maximum number of items to scan.
   */
  private static readonly SCAN_LIMIT = 25;

  /**
   * Create and set up a new dynamo table.
   */
  static async init(name: string): Promise<DynamoTable> {
    const table = new DynamoTable(name);
    await table.setup();

    return table;
  }

  /**
   * Create a new dynamo table.
   */
  constructor(private $name: string) {}

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
        TableName: this.$name,
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
        TableName: this.$name,
        Key: marshall(keys),
      })
    );
  }

  /**
   * Delete all items.
   */
  async deleteItems(): Promise<void> {
    const output = await client.send(
      new DescribeTableCommand({
        TableName: this.$name,
      })
    );

    if (!output?.Table?.KeySchema) {
      throw new Error('Missing table key schema');
    }

    const tableKeys = output.Table.KeySchema.map((key) =>
      String(key.AttributeName)
    );

    let nextKeys: Record<string, AttributeValue> | undefined;

    do {
      const input: ScanCommandInput = {
        TableName: this.$name,
        AttributesToGet: tableKeys,
        Limit: DynamoTable.SCAN_LIMIT,
      };

      if (nextKeys) {
        input.ExclusiveStartKey = nextKeys;
      }

      const output = await client.send(new ScanCommand(input));

      if (!output?.Items || output.Items.length === 0) {
        break;
      }

      await client.send(
        new BatchWriteItemCommand({
          RequestItems: {
            [this.$name]: output.Items.map((key) => ({
              DeleteRequest: { Key: key },
            })),
          },
        })
      );

      nextKeys = output.LastEvaluatedKey;
    } while (nextKeys);
  }

  /**
   * Determine if an item exists.
   */
  async containsItem(
    keys: Record<string, string>,
    attributes?: Record<string, string>
  ): Promise<boolean> {
    try {
      const output = await client.send(
        new GetItemCommand({
          TableName: this.$name,
          Key: marshall(keys),
        })
      );

      if (!output?.Item) {
        return false;
      }

      if (!attributes) {
        return true;
      }

      const item = unmarshall(output.Item);

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
