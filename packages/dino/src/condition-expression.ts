import { AttributeValue as BaseAttributeValue } from '@aws-sdk/client-dynamodb';

import { AttributePath } from './attribute-path';
import { AttributeValue } from './attribute-value';
import { Expression } from './expression';
import { ExpressionAttributes } from './expression-attributes';
import { FunctionExpression } from './function-expression';

export type ComparisonOperand =
  | AttributePath
  | AttributeValue
  | FunctionExpression
  | any;

export interface BinaryExpressionPredicate {
  type:
    | 'Equals'
    | 'NotEquals'
    | 'LessThan'
    | 'LessThanOrEqual'
    | 'GreaterThan'
    | 'GreaterThanOrEqual';
  value: ComparisonOperand;
}

export interface BetweenExpressionPredicate {
  type: 'Between';
  lowerBound: ComparisonOperand;
  upperBound: ComparisonOperand;
}

export interface MembershipExpressionPredicate {
  type: 'Membership';
  values: ComparisonOperand[];
}

export interface AttributeExistsPredicate {
  type: 'AttributeExists';
}

export interface AttributeNotExistsPredicate {
  type: 'AttributeNotExists';
}

export interface AttributeTypePredicate {
  type: 'AttributeType';
  expected: keyof BaseAttributeValue;
}

export interface BeginsWithPredicate {
  type: 'BeginsWith';
  expected: string;
}

export interface ContainsPredicate {
  type: 'Contains';
  expected: string;
}

export type ConditionExpressionPredicate =
  | BinaryExpressionPredicate
  | BetweenExpressionPredicate
  | MembershipExpressionPredicate
  | AttributeExistsPredicate
  | AttributeNotExistsPredicate
  | AttributeTypePredicate
  | BeginsWithPredicate
  | ContainsPredicate;

export interface ConditionExpressionSubject {
  subject: AttributePath | string;
}

export interface NotExpression {
  type: 'Not';
  condition: Condition;
}

export interface AndExpression {
  type: 'And';
  conditions: Condition[];
}

export interface OrExpression {
  type: 'Or';
  conditions: Condition[];
}

export type Condition =
  | (ConditionExpressionPredicate & ConditionExpressionSubject)
  | FunctionExpression
  | NotExpression
  | AndExpression
  | OrExpression;

export class ConditionExpression implements Expression {
  /**
   * Create a new condition expression.
   */
  constructor(private readonly $condition: Condition) {}

  /**
   * Serialize the condition expression to a string.
   */
  private serializeConditionExpression(
    condition: Condition,
    attributes: ExpressionAttributes
  ): string {
    if (condition instanceof FunctionExpression) {
      return condition.serialize(attributes);
    }

    switch (condition.type) {
      case 'Equals':
        return this.serializeBinaryExpression(condition, attributes, '=');
      case 'NotEquals':
        return this.serializeBinaryExpression(condition, attributes, '<>');
      case 'LessThan':
        return this.serializeBinaryExpression(condition, attributes, '<');
      case 'LessThanOrEqual':
        return this.serializeBinaryExpression(condition, attributes, '<=');
      case 'GreaterThan':
        return this.serializeBinaryExpression(condition, attributes, '>');
      case 'GreaterThanOrEqual':
        return this.serializeBinaryExpression(condition, attributes, '>=');
      case 'Between':
        const subject = attributes.addName(condition.subject);

        const lowerBound = this.serializeComparisonOperand(
          condition.lowerBound,
          attributes
        );

        const upperBound = this.serializeComparisonOperand(
          condition.upperBound,
          attributes
        );

        return `${subject} BETWEEN ${lowerBound} AND ${upperBound}`;
      case 'Membership':
        return `${attributes.addName(condition.subject)} IN (${condition.values
          .map((v) => this.serializeComparisonOperand(v, attributes))
          .join(', ')})`;
      case 'AttributeExists':
        return this.serializeFunctionExpression(
          'attribute_exists',
          condition,
          attributes
        );
      case 'AttributeNotExists':
        return this.serializeFunctionExpression(
          'attribute_not_exists',
          condition,
          attributes
        );
      case 'AttributeType':
        return this.serializeFunctionExpression(
          'attribute_type',
          condition,
          attributes
        );
      case 'BeginsWith':
        return this.serializeFunctionExpression(
          'begins_with',
          condition,
          attributes
        );
      case 'Contains':
        return this.serializeFunctionExpression(
          'contains',
          condition,
          attributes
        );
      case 'Not':
        return `NOT (${this.serializeConditionExpression(
          condition.condition,
          attributes
        )})`;
      case 'And':
      case 'Or':
        if (condition.conditions.length === 1) {
          return this.serializeConditionExpression(
            condition.conditions[0],
            attributes
          );
        }

        return condition.conditions
          .map((c) => `(${this.serializeConditionExpression(c, attributes)})`)
          .join(` ${condition.type.toUpperCase()} `);
    }

    throw new Error('Unknown condition type');
  }

  /**
   * Serialize the binary expression to a string.
   */
  private serializeBinaryExpression(
    condition: BinaryExpressionPredicate & ConditionExpressionSubject,
    attributes: ExpressionAttributes,
    comparator: string
  ): string {
    const subject = attributes.addName(condition.subject);

    const operand = this.serializeComparisonOperand(
      condition.value,
      attributes
    );

    return `${subject} ${comparator} ${operand}`;
  }

  /**
   * Serialize the function expression to a string.
   */
  private serializeFunctionExpression(
    name: string,
    condition: { subject: AttributePath | string; expected?: string },
    attributes: ExpressionAttributes
  ): string {
    const items: (AttributePath | string)[] = [];

    if (condition.subject instanceof AttributePath) {
      items.push(condition.subject);
    } else {
      items.push(new AttributePath(condition.subject));
    }

    if (condition.expected) {
      items.push(condition.expected);
    }

    return new FunctionExpression(name, items).serialize(attributes);
  }

  /**
   * Serialize the comparison operand to a string.
   */
  private serializeComparisonOperand(
    operand: ComparisonOperand,
    attributes: ExpressionAttributes
  ): string {
    if (operand instanceof FunctionExpression) {
      return operand.serialize(attributes);
    }

    return operand instanceof AttributePath
      ? attributes.addName(operand)
      : attributes.addValue(operand);
  }

  /**
   * Serialize the expression to a string.
   */
  serialize(attributes: ExpressionAttributes): string {
    return this.serializeConditionExpression(this.$condition, attributes);
  }
}
