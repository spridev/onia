import { CompiledExpression } from './compiled-expression';
import { ConditionExpression } from './condition-expression';
import { ExpressionAttributes } from './expression-attributes';
import { ProjectionExpression } from './projection-expression';
import { UpdateExpression } from './update-expression';

export class ExpressionBuilder {
  /**
   * The update expression.
   */
  private $update?: UpdateExpression;

  /**
   * The condition expression.
   */
  private $condition?: ConditionExpression;

  /**
   * The projection expression.
   */
  private $projection?: ProjectionExpression;

  /**
   * Set the update expression.
   */
  withUpdate(updateExpression: UpdateExpression): ExpressionBuilder {
    this.$update = updateExpression;

    return this;
  }

  /**
   * Clear the update expression.
   */
  clearUpdate(): ExpressionBuilder {
    this.$update = undefined;

    return this;
  }

  /**
   * Set the condition expression.
   */
  withCondition(condition: ConditionExpression): ExpressionBuilder {
    this.$condition = condition;

    return this;
  }

  /**
   * Clear the condition expression.
   */
  clearCondition(): ExpressionBuilder {
    this.$condition = undefined;

    return this;
  }

  /**
   * Set the projection expression.
   */
  withProjection(projection: ProjectionExpression): ExpressionBuilder {
    this.$projection = projection;

    return this;
  }

  /**
   * Clear the projection expression.
   */
  clearProjection(): ExpressionBuilder {
    this.$projection = undefined;

    return this;
  }

  /**
   * Compile the expression.
   */
  compile(): CompiledExpression {
    const expression: CompiledExpression = {};
    const attributes = new ExpressionAttributes();

    if (this.$update) {
      expression.UpdateExpression = this.$update.serialize(attributes);
    }

    if (this.$condition) {
      expression.ConditionExpression = this.$condition.serialize(attributes);
    }

    if (this.$projection) {
      expression.ProjectionExpression = this.$projection.serialize(attributes);
    }

    expression.ExpressionAttributeNames = attributes.names;
    expression.ExpressionAttributeValues = attributes.values;

    return expression;
  }
}
