import { marshall } from '@aws-sdk/util-dynamodb';

import { AttributeValueModel } from './attribute-value-model';

const BASE_TAG = 'AttributeValue';
const FULL_TAG = `[object ${BASE_TAG}]`;

export class AttributeValue {
  /**
   * The attribute value tag.
   */
  public readonly [Symbol.toStringTag] = BASE_TAG;

  /**
   * The attribute value.
   */
  public readonly element: AttributeValueModel;

  /**
   * Determine if the given value is an AttributeValue.
   */
  static is(value: any): value is AttributeValue {
    return (
      value instanceof AttributeValue ||
      Object.prototype.toString.call(value) === FULL_TAG
    );
  }

  /**
   * Wrap the given value in an attribute value.
   */
  static wrap(value: AttributeValue | any): AttributeValue {
    if (AttributeValue.is(value)) {
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
  constructor(value: any, marshalled = false) {
    this.element = marshalled ? value : marshall(value);
  }
}
