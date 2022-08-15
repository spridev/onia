import test from 'ava';

import {
  AttributePath,
  Condition,
  ConditionExpression,
  ExpressionAttributes,
  FunctionExpression,
} from '../src';

test('creates a condition expression from an array', function (t) {
  const attributes = new ExpressionAttributes();

  const expression = new ConditionExpression([
    { type: 'Binary', subject: 'name', value: 'spri', operator: '=' },
  ]);

  t.is(expression.serialize(attributes), '#name0 = :value1');

  t.deepEqual(attributes.names, { '#name0': 'name' });
  t.deepEqual(attributes.values, { ':value1': { S: 'spri' } });
});

test('serializes equality conditions', function (t) {
  const attributes = new ExpressionAttributes();

  const expression = new ConditionExpression().where('name', '=', 'spri');

  t.is(expression.serialize(attributes), '#name0 = :value1');

  t.deepEqual(attributes.names, { '#name0': 'name' });
  t.deepEqual(attributes.values, { ':value1': { S: 'spri' } });
});

test('serializes inequality conditions', function (t) {
  const attributes = new ExpressionAttributes();

  const path = new AttributePath('spri');

  const expression = new ConditionExpression().where('name', '<>', path);

  t.is(expression.serialize(attributes), '#name0 <> #name1');

  t.deepEqual(attributes.names, {
    '#name0': 'name',
    '#name1': 'spri',
  });

  t.is(attributes.values, undefined);
});

test('serializes less than conditions', function (t) {
  const attributes = new ExpressionAttributes();

  const expression = new ConditionExpression().where('age', '<', 25);

  t.is(expression.serialize(attributes), '#name0 < :value1');

  t.deepEqual(attributes.names, { '#name0': 'age' });
  t.deepEqual(attributes.values, { ':value1': { N: '25' } });
});

test('serializes less than or equal conditions', function (t) {
  const attributes = new ExpressionAttributes();

  const expression = new ConditionExpression().where('age', '<=', 25);

  t.is(expression.serialize(attributes), '#name0 <= :value1');

  t.deepEqual(attributes.names, { '#name0': 'age' });
  t.deepEqual(attributes.values, { ':value1': { N: '25' } });
});

test('serializes greater than conditions', function (t) {
  const attributes = new ExpressionAttributes();

  const expression = new ConditionExpression().where('age', '>', 25);

  t.is(expression.serialize(attributes), '#name0 > :value1');

  t.deepEqual(attributes.names, { '#name0': 'age' });
  t.deepEqual(attributes.values, { ':value1': { N: '25' } });
});

test('serializes greater than or equal conditions', function (t) {
  const attributes = new ExpressionAttributes();

  const expression = new ConditionExpression().where('age', '>=', 25);

  t.is(expression.serialize(attributes), '#name0 >= :value1');

  t.deepEqual(attributes.names, { '#name0': 'age' });
  t.deepEqual(attributes.values, { ':value1': { N: '25' } });
});

test('serializes between conditions', function (t) {
  const attributes = new ExpressionAttributes();

  const expression = new ConditionExpression().between('age', [25, 90]);

  t.is(expression.serialize(attributes), '#name0 BETWEEN :value1 AND :value2');

  t.deepEqual(attributes.names, {
    '#name0': 'age',
  });

  t.deepEqual(attributes.values, {
    ':value1': { N: '25' },
    ':value2': { N: '90' },
  });
});

test('serializes membership conditions', function (t) {
  const attributes = new ExpressionAttributes();

  const expression = new ConditionExpression().includes('role', [
    'admin',
    'guest',
  ]);

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

  const expression = new ConditionExpression().exists('name');

  t.is(expression.serialize(attributes), 'attribute_exists(#name0)');

  t.deepEqual(attributes.names, { '#name0': 'name' });

  t.is(attributes.values, undefined);
});

test('serializes attribute not exists functions', function (t) {
  const attributes = new ExpressionAttributes();

  const expression = new ConditionExpression().notExists('name');

  t.is(expression.serialize(attributes), 'attribute_not_exists(#name0)');

  t.deepEqual(attributes.names, { '#name0': 'name' });

  t.is(attributes.values, undefined);
});

test('serializes attribute type functions', function (t) {
  const attributes = new ExpressionAttributes();

  const expression = new ConditionExpression().type('name', 'S');

  t.is(expression.serialize(attributes), 'attribute_type(#name0, :value1)');

  t.deepEqual(attributes.names, { '#name0': 'name' });
  t.deepEqual(attributes.values, { ':value1': { S: 'S' } });
});

test('serializes contains functions', function (t) {
  const attributes = new ExpressionAttributes();

  const expression = new ConditionExpression().contains('name', 'spri');

  t.is(expression.serialize(attributes), 'contains(#name0, :value1)');

  t.deepEqual(attributes.names, { '#name0': 'name' });
  t.deepEqual(attributes.values, { ':value1': { S: 'spri' } });
});

test('serializes begins with functions', function (t) {
  const attributes = new ExpressionAttributes();

  const expression = new ConditionExpression().beginsWith('name', 'spri');

  t.is(expression.serialize(attributes), 'begins_with(#name0, :value1)');

  t.deepEqual(attributes.names, { '#name0': 'name' });
  t.deepEqual(attributes.values, { ':value1': { S: 'spri' } });
});

test('serializes function expressions', function (t) {
  const attributes = new ExpressionAttributes();

  const expression = new ConditionExpression().func(
    new FunctionExpression('size', [new AttributePath('items')])
  );

  t.is(expression.serialize(attributes), 'size(#name0)');

  t.deepEqual(attributes.names, { '#name0': 'items' });

  t.is(attributes.values, undefined);
});

test('serializes nested function expressions', function (t) {
  const attributes = new ExpressionAttributes();

  const size = new FunctionExpression('size', [new AttributePath('items')]);

  const expression = new ConditionExpression().where('total', '<', size);

  t.is(expression.serialize(attributes), '#name0 < size(#name1)');

  t.deepEqual(attributes.names, {
    '#name0': 'total',
    '#name1': 'items',
  });

  t.is(attributes.values, undefined);
});

test('serializes negation expressions', function (t) {
  const attributes = new ExpressionAttributes();

  const expression = new ConditionExpression().not((expression) => {
    expression.where('name', '=', 'spri');
  });

  t.is(expression.serialize(attributes), 'NOT (#name0 = :value1)');

  t.deepEqual(attributes.names, { '#name0': 'name' });
  t.deepEqual(attributes.values, { ':value1': { S: 'spri' } });
});

test('serializes and expressions', function (t) {
  const attributes = new ExpressionAttributes();

  const expression = new ConditionExpression().and((expression) => {
    expression.where('name', '=', 'spri');
    expression.where('age', '>=', 25);
    expression.where('age', '<', 90);
  });

  t.is(
    expression.serialize(attributes),
    '(#name0 = :value1) AND (#name2 >= :value3) AND (#name2 < :value4)'
  );

  t.deepEqual(attributes.names, {
    '#name0': 'name',
    '#name2': 'age',
  });

  t.deepEqual(attributes.values, {
    ':value1': { S: 'spri' },
    ':value3': { N: '25' },
    ':value4': { N: '90' },
  });
});

test('serializes or expressions', function (t) {
  const attributes = new ExpressionAttributes();

  const expression = new ConditionExpression().or((expression) => {
    expression.where('age', '>=', 25);
    expression.where('age', '<', 90);
  });

  t.is(
    expression.serialize(attributes),
    '(#name0 >= :value1) OR (#name0 < :value2)'
  );

  t.deepEqual(attributes.names, {
    '#name0': 'age',
  });

  t.deepEqual(attributes.values, {
    ':value1': { N: '25' },
    ':value2': { N: '90' },
  });
});

test('serializes single-clause expressions as the underlying expression type', function (t) {
  const attributes = new ExpressionAttributes();

  const expression = new ConditionExpression().and((expression) => {
    expression.where('name', '=', 'spri');
  });

  t.is(expression.serialize(attributes), '#name0 = :value1');

  t.deepEqual(attributes.names, { '#name0': 'name' });
  t.deepEqual(attributes.values, { ':value1': { S: 'spri' } });
});

test('throws when a condition type is invalid', function (t) {
  const attributes = new ExpressionAttributes();

  const unknown = { type: 'Unknown' } as unknown as Condition;

  const expression = new ConditionExpression([unknown]);

  t.throws(() => expression.serialize(attributes), {
    message: 'Unknown condition type',
  });
});
