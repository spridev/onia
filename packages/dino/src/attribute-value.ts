import { AttributeValue as BaseAttributeValue } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';

export class AttributeValue {
  /**
   * The attribute value.
   */
  public readonly element: BaseAttributeValue;

  /**
   * Create a new attribute value.
   */
  constructor(value: any, marshalled = false) {
    this.element = marshalled ? value : marshall(value);
  }
}
