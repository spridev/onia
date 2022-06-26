import test from 'ava';

import {
  AttributePath,
  ExpressionAttributes,
  FunctionExpression,
} from '../src';

test('serializes function expressions', function (t) {
  const attributes = new ExpressionAttributes();

  const expression = new FunctionExpression('contains', [
    new AttributePath('onia'),
    'dino',
  ]);

  t.is(expression.serialize(attributes), 'contains(#name0, :value1)');

  t.deepEqual(attributes.names, { '#name0': 'onia' });
  t.deepEqual(attributes.values, { ':value1': { S: 'dino' } });
});

test('serializes function expressions with nested functions', function (t) {
  const attributes = new ExpressionAttributes();

  const expression = new FunctionExpression('contains', [
    new AttributePath('onia'),
    'dino',
    new FunctionExpression('size', [new AttributePath('onia')]),
  ]);

  t.is(
    expression.serialize(attributes),
    'contains(#name0, :value1, size(#name0))'
  );

  t.deepEqual(attributes.names, { '#name0': 'onia' });
  t.deepEqual(attributes.values, { ':value1': { S: 'dino' } });
});
