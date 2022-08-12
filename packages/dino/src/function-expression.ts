import { AttributePath } from './attribute-path';
import { AttributeValue } from './attribute-value';
import { Expression } from './expression';
import { ExpressionAttributes } from './expression-attributes';

export class FunctionExpression implements Expression {
  /**
   * Create a new function expression.
   */
  constructor(
    private readonly $name: string,
    private readonly $arguments: (
      | AttributePath
      | AttributeValue
      | FunctionExpression
      | any
    )[]
  ) {}

  /**
   * Serialize the expression to a string.
   */
  serialize(attributes: ExpressionAttributes): string {
    const output: string[] = [];

    for (const item of this.$arguments) {
      if (item instanceof FunctionExpression) {
        output.push(item.serialize(attributes));
      } else if (item instanceof AttributePath) {
        output.push(attributes.addName(item));
      } else {
        output.push(attributes.addValue(item));
      }
    }

    return `${this.$name}(${output.join(', ')})`;
  }
}
