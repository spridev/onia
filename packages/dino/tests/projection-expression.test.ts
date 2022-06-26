import test from 'ava';

import { ExpressionAttributes, ProjectionExpression } from '../src';

test('adds attribute paths', function (t) {
  const attributes = new ExpressionAttributes();

  const expression = new ProjectionExpression().add('onia').add('dino');

  t.is(expression.serialize(attributes), '#name0, #name1');

  t.deepEqual(attributes.names, {
    '#name0': 'onia',
    '#name1': 'dino',
  });
});

test('removes attribute paths', function (t) {
  const attributes = new ExpressionAttributes();

  const expression = new ProjectionExpression()
    .add('onia', 'dino')
    .delete('dino')
    .delete('spri');

  t.is(expression.serialize(attributes), '#name0');

  t.deepEqual(attributes.names, {
    '#name0': 'onia',
  });
});

test('clears all attribute paths', function (t) {
  const attributes = new ExpressionAttributes();

  const expression = new ProjectionExpression().add('onia', 'dino').clear();

  t.is(expression.serialize(attributes), '');

  t.deepEqual(attributes.names, {});
});

test('serializes projection expressions with nested paths', function (t) {
  const attributes = new ExpressionAttributes();

  const expression = new ProjectionExpression('onia.dino');

  t.is(expression.serialize(attributes), '#name0.#name1');

  t.deepEqual(attributes.names, {
    '#name0': 'onia',
    '#name1': 'dino',
  });
});

test('serializes projection expressions with multiple paths', function (t) {
  const attributes = new ExpressionAttributes();

  const expression = new ProjectionExpression('onia', 'dino');

  t.is(expression.serialize(attributes), '#name0, #name1');

  t.deepEqual(attributes.names, {
    '#name0': 'onia',
    '#name1': 'dino',
  });
});
