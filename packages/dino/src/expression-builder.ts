import { ConditionExpression } from './condition-expression';
import { ExpressionAttributes } from './expression-attributes';
import { ProjectionExpression } from './projection-expression';
import { UpdateExpression } from './update-expression';

export type Overwrite<O extends object, X extends object> = {
  [K in keyof O]: K extends keyof X ? X[K] : O[K];
};

export type OverwriteType<O extends object, T> = {
  [K in keyof O]: T;
};

export interface SerializableExpressions {
  UpdateExpression: UpdateExpression;
  FilterExpression: ConditionExpression;
  ConditionExpression: ConditionExpression;
  ProjectionExpression: ProjectionExpression;
  KeyConditionExpression: ConditionExpression;
}

export type SerializableInput<T extends object> = Omit<
  Overwrite<T, SerializableExpressions>,
  'TableName'
>;

export type OutputExpressions = OverwriteType<SerializableExpressions, string>;

export class ExpressionBuilder {
  /**
   * The DynamoDB table name.
   */
  public readonly table: string;

  /**
   * Create a new expression builder.
   */
  constructor(table = 'default') {
    this.table = table;
  }

  /**
   * Compile the expression attributes.
   */
  compile<T extends Partial<OutputExpressions>>(
    input: SerializableInput<T>
  ): T {
    const attributes = new ExpressionAttributes();

    const output = {} as OutputExpressions & T;

    if (input.UpdateExpression) {
      output.UpdateExpression = input.UpdateExpression.serialize(attributes);
    }

    if (input.FilterExpression) {
      output.FilterExpression = input.FilterExpression.serialize(attributes);
    }

    if (input.ConditionExpression) {
      output.ConditionExpression =
        input.ConditionExpression.serialize(attributes);
    }

    if (input.ProjectionExpression) {
      output.ProjectionExpression =
        input.ProjectionExpression.serialize(attributes);
    }

    if (input.KeyConditionExpression) {
      output.KeyConditionExpression =
        input.KeyConditionExpression.serialize(attributes);
    }

    return {
      ...input,
      ...output,
      TableName: this.table,
      ExpressionAttributeNames: attributes.names,
      ExpressionAttributeValues: attributes.values,
    };
  }
}
