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
    UpdateExpression: 'SET #name0 = :value1',
    ExpressionAttributeNames: {
      '#name0': 'name',
    },
    ExpressionAttributeValues: {
      ':value1': { S: 'spri' },
    },
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
    ConditionExpression: '#name0 = :value1',
    ExpressionAttributeNames: {
      '#name0': 'name',
    },
    ExpressionAttributeValues: {
      ':value1': { S: 'spri' },
    },
  });
});

test('compiles projection expressions', function (t) {
  const expression = new ExpressionBuilder()
    .withProjection(new ProjectionExpression().add('name', 'age'))
    .compile();

  t.deepEqual(expression, {
    ProjectionExpression: '#name0, #name1',
    ExpressionAttributeNames: {
      '#name0': 'name',
      '#name1': 'age',
    },
    ExpressionAttributeValues: undefined,
  });
});

test('compiles multiple expressions', function (t) {
  const expression = new ExpressionBuilder()
    .withUpdate(new UpdateExpression().set('name', 'spri'))
    .withProjection(new ProjectionExpression().add('name', 'age'))
    .compile();

  t.deepEqual(expression, {
    UpdateExpression: 'SET #name0 = :value1',
    ProjectionExpression: '#name0, #name2',
    ExpressionAttributeNames: {
      '#name0': 'name',
      '#name2': 'age',
    },
    ExpressionAttributeValues: {
      ':value1': { S: 'spri' },
    },
  });
});

test('clears update expressions', function (t) {
  const expression = new ExpressionBuilder()
    .withUpdate(new UpdateExpression().set('name', 'spri'))
    .clearUpdate()
    .compile();

  t.deepEqual(expression, {
    ExpressionAttributeNames: undefined,
    ExpressionAttributeValues: undefined,
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
    ExpressionAttributeNames: undefined,
    ExpressionAttributeValues: undefined,
  });
});

test('clears projection expressions', function (t) {
  const expression = new ExpressionBuilder()
    .withProjection(new ProjectionExpression().add('name', 'age'))
    .clearProjection()
    .compile();

  t.deepEqual(expression, {
    ExpressionAttributeNames: undefined,
    ExpressionAttributeValues: undefined,
  });
});
