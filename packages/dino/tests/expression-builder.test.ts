import test from 'ava';

import {
  ConditionExpression,
  ExpressionBuilder,
  ProjectionExpression,
  UpdateExpression,
} from '../src';

test('compiles update expressions', function (t) {
  const expression = new ExpressionBuilder()
    .withUpdate(new UpdateExpression().set('name', 'spri'))
    .compile();

  t.deepEqual(expression, {
    names: {
      '#name0': 'name',
    },
    values: {
      ':value1': { S: 'spri' },
    },
    update: 'SET #name0 = :value1',
  });
});

test('compiles condition expressions', function (t) {
  const expression = new ExpressionBuilder()
    .withCondition(
      new ConditionExpression({
        type: 'Equals',
        subject: 'name',
        value: 'spri',
      })
    )
    .compile();

  t.deepEqual(expression, {
    names: {
      '#name0': 'name',
    },
    values: {
      ':value1': { S: 'spri' },
    },
    condition: '#name0 = :value1',
  });
});

test('compiles projection expressions', function (t) {
  const expression = new ExpressionBuilder()
    .withProjection(new ProjectionExpression().add('name', 'age'))
    .compile();

  t.deepEqual(expression, {
    names: {
      '#name0': 'name',
      '#name1': 'age',
    },
    values: undefined,
    projection: '#name0, #name1',
  });
});

test('compiles multiple expressions', function (t) {
  const expression = new ExpressionBuilder()
    .withUpdate(new UpdateExpression().set('name', 'spri'))
    .withProjection(new ProjectionExpression().add('name', 'age'))
    .compile();

  t.deepEqual(expression, {
    names: {
      '#name0': 'name',
      '#name2': 'age',
    },
    values: {
      ':value1': { S: 'spri' },
    },
    update: 'SET #name0 = :value1',
    projection: '#name0, #name2',
  });
});

test('clears update expressions', function (t) {
  const expression = new ExpressionBuilder()
    .withUpdate(new UpdateExpression().set('name', 'spri'))
    .clearUpdate()
    .compile();

  t.deepEqual(expression, {
    names: undefined,
    values: undefined,
  });
});

test('clears condition expressions', function (t) {
  const expression = new ExpressionBuilder()
    .withCondition(
      new ConditionExpression({
        type: 'Equals',
        subject: 'name',
        value: 'spri',
      })
    )
    .clearCondition()
    .compile();

  t.deepEqual(expression, {
    names: undefined,
    values: undefined,
  });
});

test('clears projection expressions', function (t) {
  const expression = new ExpressionBuilder()
    .withProjection(new ProjectionExpression().add('name', 'age'))
    .clearProjection()
    .compile();

  t.deepEqual(expression, {
    names: undefined,
    values: undefined,
  });
});
