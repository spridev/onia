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

  t.deepEqual(attributes.values, {});
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

  t.deepEqual(attributes.values, {});
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
    .delete('name', undefined)
    .increment('size', undefined)
    .decrement('size', undefined);

  t.is(expression.serialize(attributes), '');

  t.deepEqual(attributes.names, {});
  t.deepEqual(attributes.values, {});
});
