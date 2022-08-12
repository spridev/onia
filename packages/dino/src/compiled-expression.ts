import { AttributeValueModel } from './attribute-value-model';

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
  ExpressionAttributeValues?: Record<string, AttributeValueModel>;
}
