import { AttributePath } from './attribute-path';
import { AttributeValue } from './attribute-value';
import { Expression } from './expression';
import { ExpressionAttributes } from './expression-attributes';

const BASE_TAG = 'FunctionExpression';
const FULL_TAG = `[object ${BASE_TAG}]`;

export class FunctionExpression implements Expression {
  /**
   * The function expression tag.
   */
  public readonly [Symbol.toStringTag] = BASE_TAG;

  /**
   * Determine if the given value is a FunctionExpression.
   */
  static is(value: any): value is FunctionExpression {
    return (
      value instanceof FunctionExpression ||
      Object.prototype.toString.call(value) === FULL_TAG
    );
  }

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
      if (FunctionExpression.is(item)) {
        output.push(item.serialize(attributes));
      } else if (AttributePath.is(item)) {
        output.push(attributes.addName(item));
      } else {
        output.push(attributes.addValue(item));
      }
    }

    return `${this.$name}(${output.join(', ')})`;
  }
}
