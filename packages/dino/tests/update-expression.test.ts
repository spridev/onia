/* eslint-disable unicorn/no-useless-undefined */

import test from 'ava';

import {
  AttributePath,
  ExpressionAttributes,
  FunctionExpression,
  NumericExpression,
  UpdateExpression,
} from '../src';

test('serializes SET clauses', function (t) {
  const attributes = new ExpressionAttributes();

  const expression = new UpdateExpression()
    .set('name', new Set(['onia', 'dino']))
    .set('age', 24);

  t.is(
    expression.serialize(attributes),
    'SET #name0 = :value1, #name2 = :value3'
  );

  t.deepEqual(attributes.names, {
    '#name0': 'name',
    '#name2': 'age',
  });

  t.deepEqual(attributes.values, {
    ':value1': { SS: ['onia', 'dino'] },
    ':value3': { N: '24' },
  });
});

test('serializes SET clauses without overriding an existing attribute', function (t) {
  const attributes = new ExpressionAttributes();

  const expression = new UpdateExpression()
    .set('name', 'onia', false)
    .set(new AttributePath('age'), 25, false);

  t.is(
    expression.serialize(attributes),
    'SET #name0 = if_not_exists(#name0, :value1), #name2 = if_not_exists(#name2, :value3)'
  );

  t.deepEqual(attributes.names, {
    '#name0': 'name',
    '#name2': 'age',
  });

  t.deepEqual(attributes.values, {
    ':value1': { S: 'onia' },
    ':value3': { N: '25' },
  });
});

test('serializes SET clauses with numeric expressions', function (t) {
  const attributes = new ExpressionAttributes();

  const expression = new UpdateExpression().set(
    'onia',
    new NumericExpression('onia', '+', 1)
  );

  t.is(expression.serialize(attributes), 'SET #name0 = #name0 + :value1');

  t.deepEqual(attributes.names, { '#name0': 'onia' });
  t.deepEqual(attributes.values, { ':value1': { N: '1' } });
});

test('serializes SET clauses with function expressions', function (t) {
  const attributes = new ExpressionAttributes();

  const expression = new UpdateExpression().set(
    'onia',
    new FunctionExpression('size', [new AttributePath('items')])
  );

  t.is(expression.serialize(attributes), 'SET #name0 = size(#name1)');

  t.deepEqual(attributes.names, {
    '#name0': 'onia',
    '#name1': 'items',
  });

  t.is(attributes.values, undefined);
});

test('serializes SET clauses with appends directives', function (t) {
  const attributes = new ExpressionAttributes();

  const expression = new UpdateExpression()
    .append('comments', [{ user: 'spri', body: 'hello' }])
    .append(new AttributePath('food'), ['pasta', 'tomatoes']);

  t.is(
    expression.serialize(attributes),
    'SET #name0 = list_append(#name0, :value1), #name2 = list_append(#name2, :value3)'
  );

  t.deepEqual(attributes.names, {
    '#name0': 'comments',
    '#name2': 'food',
  });

  t.deepEqual(attributes.values, {
    ':value1': [{ M: { user: { S: 'spri' }, body: { S: 'hello' } } }],
    ':value3': [{ S: 'pasta' }, { S: 'tomatoes' }],
  });
});

test('serializes SET clauses with increments directives', function (t) {
  const attributes = new ExpressionAttributes();

  const expression = new UpdateExpression().increment('size', 1);

  t.is(expression.serialize(attributes), 'SET #name0 = #name0 + :value1');

  t.deepEqual(attributes.names, { '#name0': 'size' });
  t.deepEqual(attributes.values, { ':value1': { N: '1' } });
});

test('serializes SET clauses with decrements directives', function (t) {
  const attributes = new ExpressionAttributes();

  const expression = new UpdateExpression().decrement('size', 9);

  t.is(expression.serialize(attributes), 'SET #name0 = #name0 - :value1');

  t.deepEqual(attributes.names, { '#name0': 'size' });
  t.deepEqual(attributes.values, { ':value1': { N: '9' } });
});

test('serializes ADD clauses', function (t) {
  const attributes = new ExpressionAttributes();

  const expression = new UpdateExpression()
    .add('name', new Set(['onia', 'dino']))
    .add('age', 24);

  t.is(expression.serialize(attributes), 'ADD #name0 :value1, #name2 :value3');

  t.deepEqual(attributes.names, {
    '#name0': 'name',
    '#name2': 'age',
  });

  t.deepEqual(attributes.values, {
    ':value1': { SS: ['onia', 'dino'] },
    ':value3': { N: '24' },
  });
});

test('serializes DELETE clauses', function (t) {
  const attributes = new ExpressionAttributes();

  const expression = new UpdateExpression()
    .delete('name', new Set(['onia', 'dino']))
    .delete('age', 24);

  t.is(
    expression.serialize(attributes),
    'DELETE #name0 :value1, #name2 :value3'
  );

  t.deepEqual(attributes.names, {
    '#name0': 'name',
    '#name2': 'age',
  });

  t.deepEqual(attributes.values, {
    ':value1': { SS: ['onia', 'dino'] },
    ':value3': { N: '24' },
  });
});

test('serializes REMOVE clauses', function (t) {
  const attributes = new ExpressionAttributes();

  const expression = new UpdateExpression().remove('name').remove('age');

  t.is(expression.serialize(attributes), 'REMOVE #name0, #name1');

  t.deepEqual(attributes.names, {
    '#name0': 'name',
    '#name1': 'age',
  });

  t.is(attributes.values, undefined);
});

test('serializes expressions with multiple clauses', function (t) {
  const attributes = new ExpressionAttributes();

  const expression = new UpdateExpression()
    .set('onia', 'dino')
    .add('name', new Set(['onia']))
    .delete('name', new Set(['spri']))
    .remove('age');

  t.is(
    expression.serialize(attributes),
    'SET #name0 = :value1 ADD #name2 :value3 DELETE #name2 :value4 REMOVE #name5'
  );

  t.deepEqual(attributes.names, {
    '#name0': 'onia',
    '#name2': 'name',
    '#name5': 'age',
  });

  t.deepEqual(attributes.values, {
    ':value1': { S: 'dino' },
    ':value3': { SS: ['onia'] },
    ':value4': { SS: ['spri'] },
  });
});

test('serializes expressions without undefined values', function (t) {
  const attributes = new ExpressionAttributes();

  const expression = new UpdateExpression()
    .set('onia', undefined)
    .add('name', undefined)
    .delete('name', undefined);

  t.is(expression.serialize(attributes), '');

  t.is(attributes.names, undefined);
  t.is(attributes.values, undefined);
});
