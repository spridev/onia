import { AttributePath } from './attribute-path';
import { AttributeValue } from './attribute-value';
import { AttributeValueModel } from './attribute-value-model';
import { Expression } from './expression';
import { ExpressionAttributes } from './expression-attributes';
import { FunctionExpression } from './function-expression';

export type ComparisonOperand =
  | AttributePath
  | AttributeValue
  | FunctionExpression
  | any;

export type ComparisonOperator = '=' | '<>' | '<' | '<=' | '>' | '>=';

export interface BinaryExpressionPredicate {
  type: 'Binary';
  value: ComparisonOperand;
  operator: ComparisonOperator;
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

export interface ExistsPredicate {
  type: 'Exists';
}

export interface NotExistsPredicate {
  type: 'NotExists';
}

export interface TypePredicate {
  type: 'Type';
  expected: keyof AttributeValueModel;
}

export interface ContainsPredicate {
  type: 'Contains';
  expected: string;
}

export interface BeginsWithPredicate {
  type: 'BeginsWith';
  expected: string;
}

export type ConditionExpressionPredicate =
  | BinaryExpressionPredicate
  | BetweenExpressionPredicate
  | MembershipExpressionPredicate
  | ExistsPredicate
  | NotExistsPredicate
  | TypePredicate
  | ContainsPredicate
  | BeginsWithPredicate;

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
   * The expression conditions.
   */
  private readonly $conditions: Condition[] = [];

  /**
   * Create a new condition expression.
   */
  constructor(conditions?: Condition[]) {
    if (conditions) {
      this.$conditions = conditions;
    }
  }

  /**
   * Add a binary expression to the conditions.
   */
  where(
    subject: ConditionExpressionSubject['subject'],
    operator: BinaryExpressionPredicate['operator'],
    value: BinaryExpressionPredicate['value']
  ): ConditionExpression {
    this.$conditions.push({ type: 'Binary', subject, value, operator });

    return this;
  }

  /**
   * Add a between expression to the conditions.
   */
  between(
    subject: ConditionExpressionSubject['subject'],
    values: [
      BetweenExpressionPredicate['lowerBound'],
      BetweenExpressionPredicate['upperBound']
    ]
  ): ConditionExpression {
    this.$conditions.push({
      type: 'Between',
      subject,
      lowerBound: values[0],
      upperBound: values[1],
    });

    return this;
  }

  /**
   * Add a membership expression to the conditions.
   */
  includes(
    subject: ConditionExpressionSubject['subject'],
    values: MembershipExpressionPredicate['values']
  ): ConditionExpression {
    this.$conditions.push({ type: 'Membership', subject, values });

    return this;
  }

  /**
   * Add an attribute exists expression to the conditions.
   */
  exists(subject: ConditionExpressionSubject['subject']): ConditionExpression {
    this.$conditions.push({ type: 'Exists', subject });

    return this;
  }

  /**
   * Add an attribute not exists expression to the conditions.
   */
  notExists(
    subject: ConditionExpressionSubject['subject']
  ): ConditionExpression {
    this.$conditions.push({ type: 'NotExists', subject });

    return this;
  }

  /**
   * Add an attribute type expression to the conditions.
   */
  type(
    subject: ConditionExpressionSubject['subject'],
    expected: TypePredicate['expected']
  ): ConditionExpression {
    this.$conditions.push({ type: 'Type', subject, expected });

    return this;
  }

  /**
   * Add a contains expression to the conditions.
   */
  contains(
    subject: ConditionExpressionSubject['subject'],
    expected: ContainsPredicate['expected']
  ): ConditionExpression {
    this.$conditions.push({ type: 'Contains', subject, expected });

    return this;
  }

  /**
   * Add a begins with expression to the conditions.
   */
  beginsWith(
    subject: ConditionExpressionSubject['subject'],
    expected: BeginsWithPredicate['expected']
  ): ConditionExpression {
    this.$conditions.push({ type: 'BeginsWith', subject, expected });

    return this;
  }

  /**
   * Add a function expression to the conditions.
   */
  func(expression: FunctionExpression): ConditionExpression {
    this.$conditions.push(expression);

    return this;
  }

  /**
   * Add a negation expression to the conditions.
   */
  not(builder: (expression: ConditionExpression) => void): ConditionExpression {
    const expression = new ConditionExpression();

    builder(expression);

    const [condition] = expression.$conditions;

    this.$conditions.push({ type: 'Not', condition });

    return this;
  }

  /**
   * Add an and expression to the conditions.
   */
  and(builder: (expression: ConditionExpression) => void): ConditionExpression {
    const expression = new ConditionExpression();

    builder(expression);

    this.$conditions.push({ type: 'And', conditions: expression.$conditions });

    return this;
  }

  /**
   * Add an or expression to the conditions.
   */
  or(builder: (expression: ConditionExpression) => void): ConditionExpression {
    const expression = new ConditionExpression();

    builder(expression);

    this.$conditions.push({ type: 'Or', conditions: expression.$conditions });

    return this;
  }

  /**
   * Serialize the condition expression to a string.
   */
  private serializeConditionExpression(
    condition: Condition,
    attributes: ExpressionAttributes
  ): string {
    if (FunctionExpression.is(condition)) {
      return condition.serialize(attributes);
    }

    switch (condition.type) {
      case 'Binary': {
        return this.serializeBinaryExpression(condition, attributes);
      }
      case 'Between': {
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
      }
      case 'Membership': {
        return `${attributes.addName(condition.subject)} IN (${condition.values
          .map((v) => this.serializeComparisonOperand(v, attributes))
          .join(', ')})`;
      }
      case 'Exists': {
        return this.serializeFunctionExpression(
          'attribute_exists',
          condition,
          attributes
        );
      }
      case 'NotExists': {
        return this.serializeFunctionExpression(
          'attribute_not_exists',
          condition,
          attributes
        );
      }
      case 'Type': {
        return this.serializeFunctionExpression(
          'attribute_type',
          condition,
          attributes
        );
      }
      case 'Contains': {
        return this.serializeFunctionExpression(
          'contains',
          condition,
          attributes
        );
      }
      case 'BeginsWith': {
        return this.serializeFunctionExpression(
          'begins_with',
          condition,
          attributes
        );
      }
      case 'Not': {
        return `NOT (${this.serializeConditionExpression(
          condition.condition,
          attributes
        )})`;
      }
      case 'And':
      case 'Or': {
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
    }

    throw new Error('Unknown condition type');
  }

  /**
   * Serialize the binary expression to a string.
   */
  private serializeBinaryExpression(
    condition: BinaryExpressionPredicate & ConditionExpressionSubject,
    attributes: ExpressionAttributes
  ): string {
    const subject = attributes.addName(condition.subject);

    const operand = this.serializeComparisonOperand(
      condition.value,
      attributes
    );

    return `${subject} ${condition.operator} ${operand}`;
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

    items.push(AttributePath.wrap(condition.subject));

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
    if (FunctionExpression.is(operand)) {
      return operand.serialize(attributes);
    }

    return AttributePath.is(operand)
      ? attributes.addName(operand)
      : attributes.addValue(operand);
  }

  /**
   * Serialize the expression to a string.
   */
  serialize(attributes: ExpressionAttributes): string {
    const condition: Condition = { type: 'And', conditions: this.$conditions };

    return this.serializeConditionExpression(condition, attributes);
  }
}
