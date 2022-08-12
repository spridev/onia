import { marshall } from '@aws-sdk/util-dynamodb';

import { AttributeValueModel } from './attribute-value-model';

export class AttributeValue {
  /**
   * The attribute value.
   */
  public readonly element: AttributeValueModel;

  /**
   * Wrap the given value in an attribute value.
   */
  static wrap(value: AttributeValue | any): AttributeValue {
    if (value instanceof AttributeValue) {
      return value;
    }

    if (typeof value === 'function') {
      return new AttributeValue(value());
    }

    return new AttributeValue(value);
  }

  /**
   * Create a new attribute value.
   */
  constructor(value: any) {
    this.element = marshall(value) as unknown as AttributeValueModel;
  }
}
