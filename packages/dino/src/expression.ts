import { ExpressionAttributes } from './expression-attributes';

export interface Expression {
  /**
   * Serialize the expression to a string.
   */
  serialize(attributes: ExpressionAttributes): string;
}
