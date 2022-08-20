import { AttributePath } from './attribute-path';
import { AttributeValue } from './attribute-value';
import { Expression } from './expression';
import { ExpressionAttributes } from './expression-attributes';
import { FunctionExpression } from './function-expression';

const BASE_TAG = 'NumericExpression';
const FULL_TAG = `[object ${BASE_TAG}]`;

export type NumericOperand =
  | AttributePath
  | AttributeValue
  | FunctionExpression
  | string
  | number;

export class NumericExpression implements Expression {
  /**
   * The numeric expression tag.
   */
  public readonly [Symbol.toStringTag] = BASE_TAG;

  /**
   * Determine if the given value is a NumericExpression.
   */
  static is(value: any): value is NumericExpression {
    return (
      value instanceof NumericExpression ||
      Object.prototype.toString.call(value) === FULL_TAG
    );
  }

  /**
   * Create a new numeric expression.
   */
  constructor(
    private readonly $left: NumericOperand,
    private readonly $operator: '+' | '-',
    private readonly $right: NumericOperand
  ) {}

  /**
   * Serialize the numeric operand to a string.
   */
  private serializeNumericOperand(
    operand: NumericOperand,
    attributes: ExpressionAttributes
  ): string {
    if (FunctionExpression.is(operand)) {
      return operand.serialize(attributes);
    }

    return AttributePath.is(operand) || typeof operand === 'string'
      ? attributes.addName(operand)
      : attributes.addValue(operand);
  }

  /**
   * Serialize the expression to a string.
   */
  serialize(attributes: ExpressionAttributes): string {
    const left = this.serializeNumericOperand(this.$left, attributes);
    const right = this.serializeNumericOperand(this.$right, attributes);

    return `${left} ${this.$operator} ${right}`;
  }
}
