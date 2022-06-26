import test from 'ava';

import {
  AttributePath,
  ExpressionAttributes,
  FunctionExpression,
  NumericExpression,
} from '../src';

test('serializes numeric expressions', function (t) {
  const attributes = new ExpressionAttributes();

  const expression = new NumericExpression('count', '+', 1);

  t.is(expression.serialize(attributes), '#name0 + :value1');

  t.deepEqual(attributes.names, { '#name0': 'count' });
  t.deepEqual(attributes.values, { ':value1': { N: '1' } });
});

test('serializes numeric expressions with nested functions', function (t) {
  const attributes = new ExpressionAttributes();

  const expression = new NumericExpression(
    new FunctionExpression('size', [new AttributePath('items')]),
    '+',
    1
  );

  t.is(expression.serialize(attributes), 'size(#name0) + :value1');

  t.deepEqual(attributes.names, { '#name0': 'items' });
  t.deepEqual(attributes.values, { ':value1': { N: '1' } });
});
