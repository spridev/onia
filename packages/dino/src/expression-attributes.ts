import { AttributeValue as BaseAttributeValue } from '@aws-sdk/client-dynamodb';

import { AttributePath } from './attribute-path';
import { AttributeValue } from './attribute-value';

/**
 * Determine if the given object is empty.
 */
function isObjectEmpty<T>(object: Record<string, T>): boolean {
  return Object.keys(object).length === 0;
}

export class ExpressionAttributes {
  /**
   * The attribute names.
   */
  private readonly $names: Record<string, string> = {};

  /**
   * The attribute values.
   */
  private readonly $values: Record<string, BaseAttributeValue> = {};

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
          this.$names[substitution] = element.name;
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

    this.$values[substitution] = value.element;

    return substitution;
  }

  /**
   * Get the attribute names.
   */
  get names(): Record<string, string> | undefined {
    return !isObjectEmpty(this.$names) ? this.$names : undefined;
  }

  /**
   * Get the attribute values.
   */
  get values(): Record<string, BaseAttributeValue> | undefined {
    return !isObjectEmpty(this.$values) ? this.$values : undefined;
  }
}
