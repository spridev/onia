import { AttributePath } from './attribute-path';
import { Expression } from './expression';
import { ExpressionAttributes } from './expression-attributes';

export class ProjectionExpression implements Expression {
  /**
   * The expression paths.
   */
  private readonly $paths = new Set<AttributePath | string>();

  /**
   * Create a new projection expression.
   */
  constructor(...paths: (AttributePath | string)[]) {
    this.add(...paths);
  }

  /**
   * Add attribute paths to the expression.
   */
  add(...paths: (AttributePath | string)[]): ProjectionExpression {
    for (const path of paths) {
      this.$paths.add(path);
    }

    return this;
  }

  /**
   * Remove attribute paths from the expression.
   */
  delete(...paths: (AttributePath | string)[]): ProjectionExpression {
    for (const path of paths) {
      this.$paths.delete(path);
    }

    return this;
  }

  /**
   * Clear all attribute paths from the expression.
   */
  clear(): ProjectionExpression {
    this.$paths.clear();

    return this;
  }

  /**
   * Serialize the expression to a string.
   */
  serialize(attributes: ExpressionAttributes): string {
    const output: string[] = [];

    for (const path of this.$paths) {
      output.push(attributes.addName(path));
    }

    return output.join(', ');
  }
}
