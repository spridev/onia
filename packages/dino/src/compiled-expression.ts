import { AttributeValue as BaseAttributeValue } from '@aws-sdk/client-dynamodb';

export interface CompiledExpression {
  /**
   * The update expression.
   */
  update?: string;

  /**
   * The condition expression.
   */
  condition?: string;

  /**
   * The projection expression.
   */
  projection?: string;

  /**
   * The expression attribute names.
   */
  names?: Record<string, string>;

  /**
   * The expression attribute values.
   */
  values?: Record<string, BaseAttributeValue>;
}
