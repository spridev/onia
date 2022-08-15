import { CompiledExpression } from './compiled-expression';
import { ExpressionAttributes } from './expression-attributes';

export class ExpressionBuilder {
  /**
   * The DynamoDB table name.
   */
  public readonly table: string;

  /**
   * Create a new expression builder.
   */
  constructor(table = 'table') {
    this.table = table;
  }

  /**
   * Compile the expression.
   */
  compile<T>(
    serializer: (attributes: ExpressionAttributes) => T
  ): T & CompiledExpression {
    const attributes = new ExpressionAttributes();

    return {
      ...serializer(attributes),
      TableName: this.table,
      ExpressionAttributeNames: attributes.names,
      ExpressionAttributeValues: attributes.values,
    };
  }
}
