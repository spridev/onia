import { AttributeValue as BaseAttributeValue } from '@aws-sdk/client-dynamodb';

import { AttributePath } from './attribute-path';
import { AttributeValue } from './attribute-value';

export class ExpressionAttributes {
  /**
   * The attribute names.
   */
  public readonly names: Record<string, string> = {};

  /**
   * The attribute values.
   */
  public readonly values: Record<string, BaseAttributeValue> = {};

  /**
   * The attribute substitutions.
   */
  private readonly $substitutions: Map<string, string> = new Map();

  /**
   * The attributes counter.
   */
  private $counter = 0;

  /**
   * Add an attribute path to this substitution context.
   */
  addName(path: AttributePath | string): string {
    if (!(path instanceof AttributePath)) {
      return this.addName(new AttributePath(path));
    }

    let output = '';

    for (const element of path.elements) {
      if ('name' in element) {
        if (!this.$substitutions.has(element.name)) {
          this.$substitutions.set(element.name, `#name${this.$counter++}`);
        }

        const substitution = this.$substitutions.get(element.name);

        if (substitution) {
          this.names[substitution] = element.name;
        }

        output += `.${substitution}`;
      } else {
        output += `[${element.index}]`;
      }
    }

    return output.slice(1);
  }

  /**
   * Add an attribute value to this substitution context.
   */
  addValue(value: AttributeValue | any): string {
    if (!(value instanceof AttributeValue)) {
      return this.addValue(new AttributeValue(value));
    }

    const substitution = `:value${this.$counter++}`;

    this.values[substitution] = value.element;

    return substitution;
  }
}
