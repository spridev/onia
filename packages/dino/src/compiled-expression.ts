import { AttributeValue as BaseAttributeValue } from '@aws-sdk/client-dynamodb';

export interface CompiledExpression {
  /**
   * The update expression.
   */
  UpdateExpression?: string;

  /**
   * The condition expression.
   */
  ConditionExpression?: string;

  /**
   * The projection expression.
   */
  ProjectionExpression?: string;

  /**
   * The expression attribute names.
   */
  ExpressionAttributeNames?: Record<string, string>;

  /**
   * The expression attribute values.
   */
  ExpressionAttributeValues?: Record<string, BaseAttributeValue>;
}
