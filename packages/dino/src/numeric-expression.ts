import { AttributePath } from './attribute-path';
import { Expression } from './expression';
import { ExpressionAttributes } from './expression-attributes';
import { FunctionExpression } from './function-expression';

export type NumericOperand =
  | FunctionExpression
  | AttributePath
  | string
  | number;

export class NumericExpression implements Expression {
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
    if (operand instanceof FunctionExpression) {
      return operand.serialize(attributes);
    }

    return operand instanceof AttributePath || typeof operand === 'string'
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
