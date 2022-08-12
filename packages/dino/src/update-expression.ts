import { AttributePath } from './attribute-path';
import { AttributeValue } from './attribute-value';
import { Expression } from './expression';
import { ExpressionAttributes } from './expression-attributes';
import { FunctionExpression } from './function-expression';
import { NumericExpression } from './numeric-expression';

export class UpdateExpression implements Expression {
  /**
   * The expression's SET clause directives.
   */
  private readonly $set = new Map<
    AttributePath | string,
    AttributeValue | FunctionExpression | NumericExpression | any
  >();

  /**
   * The expression's ADD clause directives.
   */
  private readonly $add = new Map<
    AttributePath | string,
    AttributeValue | any
  >();

  /**
   * The expression's DELETE clause directives.
   */
  private readonly $delete = new Map<
    AttributePath | string,
    AttributeValue | any
  >();

  /**
   * The expression's REMOVE clause directives.
   */
  private readonly $remove = new Set<AttributePath | string>();

  /**
   * Add a directive to the expression's SET clause.
   */
  set(
    path: AttributePath | string,
    value: AttributeValue | FunctionExpression | NumericExpression | any,
    overwrite = true
  ): UpdateExpression {
    if (value === undefined) return this;

    if (overwrite) {
      this.$set.set(path, value);
    } else {
      this.$set.set(
        path,
        new FunctionExpression('if_not_exists', [
          typeof path === 'string' ? new AttributePath(path) : path,
          value,
        ])
      );
    }
    return this;
  }

  /**
   * Add an append directive to the expression's SET clause.
   */
  append(
    path: AttributePath | string,
    values: (AttributePath | AttributeValue | any)[]
  ): UpdateExpression {
    this.$set.set(
      path,
      new FunctionExpression('list_append', [
        typeof path === 'string' ? new AttributePath(path) : path,
        values,
      ])
    );

    return this;
  }

  /**
   * Add an increment directive to the expression's SET clause.
   */
  increment(
    path: AttributePath | string,
    value: AttributePath | FunctionExpression | string | number = 1
  ): UpdateExpression {
    this.$set.set(path, new NumericExpression(path, '+', value));

    return this;
  }

  /**
   * Add a decrement directive to the expression's SET clause.
   */
  decrement(
    path: AttributePath | string,
    value: AttributePath | FunctionExpression | string | number = 1
  ): UpdateExpression {
    this.$set.set(path, new NumericExpression(path, '-', value));

    return this;
  }

  /**
   * Add a directive to the expression's ADD clause.
   */
  add(
    path: AttributePath | string,
    value: AttributeValue | any
  ): UpdateExpression {
    if (value === undefined) return this;

    this.$add.set(path, value);

    return this;
  }

  /**
   * Add a directive to the expression's DELETE clause.
   */
  delete(
    path: AttributePath | string,
    value: AttributeValue | any
  ): UpdateExpression {
    if (value === undefined) return this;

    this.$delete.set(path, value);

    return this;
  }

  /**
   * Add a directive to the expression's REMOVE clause.
   */
  remove(path: AttributePath | string): UpdateExpression {
    this.$remove.add(path);

    return this;
  }

  /**
   * Serialize the expression to a string.
   */
  serialize(attributes: ExpressionAttributes): string {
    const clauses: string[] = [];
    const phrases: string[] = [];

    for (const [path, value] of this.$set.entries()) {
      phrases.push(
        `${attributes.addName(path)} = ${
          value instanceof FunctionExpression ||
          value instanceof NumericExpression
            ? value.serialize(attributes)
            : attributes.addValue(value)
        }`
      );
    }

    if (phrases.length > 0) {
      clauses.push(`SET ${phrases.join(', ')}`);
      phrases.length = 0;
    }

    for (const { verb, map } of [
      { verb: 'ADD', map: this.$add },
      { verb: 'DELETE', map: this.$delete },
    ]) {
      for (const [path, value] of map.entries()) {
        phrases.push(
          `${attributes.addName(path)} ${attributes.addValue(value)}`
        );
      }

      if (phrases.length > 0) {
        clauses.push(`${verb} ${phrases.join(', ')}`);
        phrases.length = 0;
      }
    }

    for (const path of this.$remove) {
      phrases.push(attributes.addName(path));
    }

    if (phrases.length > 0) {
      clauses.push(`REMOVE ${phrases.join(', ')}`);
      phrases.length = 0;
    }

    return clauses.join(' ');
  }
}
