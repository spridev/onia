import { marshall } from '@aws-sdk/util-dynamodb';

import { AttributeValueModel } from './attribute-value-model';

export class AttributeValue {
  /**
   * The attribute value.
   */
  public readonly element: AttributeValueModel;

  /**
   * Create a new attribute value.
   */
  constructor(value: any) {
    this.element = marshall(value) as unknown as AttributeValueModel;
  }
}
