import test from 'ava';

import {
  AttributePath,
  ConditionExpression,
  ExpressionAttributes,
  FunctionExpression,
} from '../src';

test('serializes equality conditions', function (t) {
  const attributes = new ExpressionAttributes();

  const expression = new ConditionExpression({
    type: 'Equals',
    subject: 'name',
    value: 'spri',
  });

  t.is(expression.serialize(attributes), '#name0 = :value1');

  t.deepEqual(attributes.names, { '#name0': 'name' });
  t.deepEqual(attributes.values, { ':value1': { S: 'spri' } });
});

test('serializes inequality conditions', function (t) {
  const attributes = new ExpressionAttributes();

  const expression = new ConditionExpression({
    type: 'NotEquals',
    subject: 'name',
    value: 'spri',
  });

  t.is(expression.serialize(attributes), '#name0 <> :value1');

  t.deepEqual(attributes.names, { '#name0': 'name' });
  t.deepEqual(attributes.values, { ':value1': { S: 'spri' } });
});

test('serializes less than conditions', function (t) {
  const attributes = new ExpressionAttributes();

  const expression = new ConditionExpression({
    type: 'LessThan',
    subject: 'name',
    value: 'spri',
  });

  t.is(expression.serialize(attributes), '#name0 < :value1');

  t.deepEqual(attributes.names, { '#name0': 'name' });
  t.deepEqual(attributes.values, { ':value1': { S: 'spri' } });
});

test('serializes less than or equal conditions', function (t) {
  const attributes = new ExpressionAttributes();

  const expression = new ConditionExpression({
    type: 'LessThanOrEqual',
    subject: 'name',
    value: new AttributePath('onia'),
  });

  t.is(expression.serialize(attributes), '#name0 <= #name1');

  t.deepEqual(attributes.names, {
    '#name0': 'name',
    '#name1': 'onia',
  });

  t.deepEqual(attributes.values, {});
});

test('serializes greater than conditions', function (t) {
  const attributes = new ExpressionAttributes();

  const expression = new ConditionExpression({
    type: 'GreaterThan',
    subject: 'name',
    value: new FunctionExpression('size', [new AttributePath('onia')]),
  });

  t.is(expression.serialize(attributes), '#name0 > size(#name1)');

  t.deepEqual(attributes.names, {
    '#name0': 'name',
    '#name1': 'onia',
  });

  t.deepEqual(attributes.values, {});
});

test('serializes greater than or equal conditions', function (t) {
  const attributes = new ExpressionAttributes();

  const expression = new ConditionExpression({
    type: 'GreaterThanOrEqual',
    subject: 'name',
    value: new AttributePath('onia'),
  });

  t.is(expression.serialize(attributes), '#name0 >= #name1');

  t.deepEqual(attributes.names, {
    '#name0': 'name',
    '#name1': 'onia',
  });

  t.deepEqual(attributes.values, {});
});

test('serializes between conditions', function (t) {
  const attributes = new ExpressionAttributes();

  const expression = new ConditionExpression({
    type: 'Between',
    subject: 'age',
    lowerBound: 18,
    upperBound: 90,
  });

  t.is(expression.serialize(attributes), '#name0 BETWEEN :value1 AND :value2');

  t.deepEqual(attributes.names, {
    '#name0': 'age',
  });

  t.deepEqual(attributes.values, {
    ':value1': { N: '18' },
    ':value2': { N: '90' },
  });
});

test('serializes membership conditions', function (t) {
  const attributes = new ExpressionAttributes();

  const expression = new ConditionExpression({
    type: 'Membership',
    subject: 'role',
    values: ['admin', 'guest'],
  });

  t.is(expression.serialize(attributes), '#name0 IN (:value1, :value2)');

  t.deepEqual(attributes.names, {
    '#name0': 'role',
  });

  t.deepEqual(attributes.values, {
    ':value1': { S: 'admin' },
    ':value2': { S: 'guest' },
  });
});

test('serializes attribute exists functions', function (t) {
  const attributes = new ExpressionAttributes();

  const expression = new ConditionExpression({
    type: 'AttributeExists',
    subject: 'name',
  });

  t.is(expression.serialize(attributes), 'attribute_exists(#name0)');

  t.deepEqual(attributes.names, { '#name0': 'name' });
  t.deepEqual(attributes.values, {});
});

test('serializes attribute not exists functions', function (t) {
  const attributes = new ExpressionAttributes();

  const expression = new ConditionExpression({
    type: 'AttributeNotExists',
    subject: 'name',
  });

  t.is(expression.serialize(attributes), 'attribute_not_exists(#name0)');

  t.deepEqual(attributes.names, { '#name0': 'name' });
  t.deepEqual(attributes.values, {});
});

test('serializes attribute type functions', function (t) {
  const attributes = new ExpressionAttributes();

  const expression = new ConditionExpression({
    type: 'AttributeType',
    subject: 'name',
    expected: 'S',
  });

  t.is(expression.serialize(attributes), 'attribute_type(#name0, :value1)');

  t.deepEqual(attributes.names, { '#name0': 'name' });
  t.deepEqual(attributes.values, { ':value1': { S: 'S' } });
});

test('serializes begins with functions', function (t) {
  const attributes = new ExpressionAttributes();

  const expression = new ConditionExpression({
    type: 'BeginsWith',
    subject: new AttributePath('name'),
    expected: 'spri',
  });

  t.is(expression.serialize(attributes), 'begins_with(#name0, :value1)');

  t.deepEqual(attributes.names, { '#name0': 'name' });
  t.deepEqual(attributes.values, { ':value1': { S: 'spri' } });
});

test('serializes contains functions', function (t) {
  const attributes = new ExpressionAttributes();

  const expression = new ConditionExpression({
    type: 'Contains',
    subject: new AttributePath('name'),
    expected: 'spri',
  });

  t.is(expression.serialize(attributes), 'contains(#name0, :value1)');

  t.deepEqual(attributes.names, { '#name0': 'name' });
  t.deepEqual(attributes.values, { ':value1': { S: 'spri' } });
});

test('serializes negation expressions', function (t) {
  const attributes = new ExpressionAttributes();

  const expression = new ConditionExpression({
    type: 'Not',
    condition: {
      type: 'Equals',
      subject: 'name',
      value: 'spri',
    },
  });

  t.is(expression.serialize(attributes), 'NOT (#name0 = :value1)');

  t.deepEqual(attributes.names, { '#name0': 'name' });
  t.deepEqual(attributes.values, { ':value1': { S: 'spri' } });
});

test('serializes and expressions', function (t) {
  const attributes = new ExpressionAttributes();

  const expression = new ConditionExpression({
    type: 'And',
    conditions: [
      {
        type: 'Equals',
        subject: 'name',
        value: 'spri',
      },
      {
        type: 'LessThan',
        subject: 'age',
        value: '90',
      },
      {
        type: 'GreaterThanOrEqual',
        subject: 'age',
        value: '18',
      },
    ],
  });

  t.is(
    expression.serialize(attributes),
    '(#name0 = :value1) AND (#name2 < :value3) AND (#name2 >= :value4)'
  );

  t.deepEqual(attributes.names, {
    '#name0': 'name',
    '#name2': 'age',
  });

  t.deepEqual(attributes.values, {
    ':value1': { S: 'spri' },
    ':value3': { S: '90' },
    ':value4': { S: '18' },
  });
});

test('serializes or expressions', function (t) {
  const attributes = new ExpressionAttributes();

  const expression = new ConditionExpression({
    type: 'Or',
    conditions: [
      {
        type: 'LessThan',
        subject: 'age',
        value: '90',
      },
      {
        type: 'GreaterThanOrEqual',
        subject: 'age',
        value: '18',
      },
    ],
  });

  t.is(
    expression.serialize(attributes),
    '(#name0 < :value1) OR (#name0 >= :value2)'
  );

  t.deepEqual(attributes.names, {
    '#name0': 'age',
  });

  t.deepEqual(attributes.values, {
    ':value1': { S: '90' },
    ':value2': { S: '18' },
  });
});

test('serializes single-clause expressions as the underlying expression type', function (t) {
  const attributes = new ExpressionAttributes();

  const expression = new ConditionExpression({
    type: 'And',
    conditions: [
      {
        type: 'Equals',
        subject: 'name',
        value: 'spri',
      },
    ],
  });

  t.is(expression.serialize(attributes), '#name0 = :value1');

  t.deepEqual(attributes.names, { '#name0': 'name' });
  t.deepEqual(attributes.values, { ':value1': { S: 'spri' } });
});

test('serializes condition expressions with nested functions', function (t) {
  const attributes = new ExpressionAttributes();

  const expression = new ConditionExpression(
    new FunctionExpression('attribute_type', [new AttributePath('onia'), 'S'])
  );

  t.is(expression.serialize(attributes), 'attribute_type(#name0, :value1)');

  t.deepEqual(attributes.names, { '#name0': 'onia' });
  t.deepEqual(attributes.values, { ':value1': { S: 'S' } });
});
