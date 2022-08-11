import { AttributeValue as BaseAttributeValue } from '@aws-sdk/client-dynamodb';

export interface CompiledExpression {
  /**
   * The expression table name.
   */
  TableName: string;

  /**
   * The expression attribute names.
   */
  ExpressionAttributeNames?: Record<string, string>;

  /**
   * The expression attribute values.
   */
  ExpressionAttributeValues?: Record<string, BaseAttributeValue>;
}
