import test from 'ava';

import {
  ConditionExpression,
  ExpressionBuilder,
  ProjectionExpression,
  UpdateExpression,
} from '../src';

test('compiles update expressions', function (t) {
  const builder = new ExpressionBuilder('onia-table');

  const update = new UpdateExpression().set('name', 'spri');

  const expression = builder.compile((attributes) => ({
    UpdateExpression: update.serialize(attributes),
  }));

  t.deepEqual(expression, {
    TableName: 'onia-table',
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
  const builder = new ExpressionBuilder('onia-table');

  const condition = new ConditionExpression({
    type: 'Equals',
    subject: 'name',
    value: 'spri',
  });

  const expression = builder.compile((attributes) => ({
    ConditionExpression: condition.serialize(attributes),
  }));

  t.deepEqual(expression, {
    TableName: 'onia-table',
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
  const builder = new ExpressionBuilder('onia-table');

  const projection = new ProjectionExpression().add('name', 'age');

  const expression = builder.compile((attributes) => ({
    ProjectionExpression: projection.serialize(attributes),
  }));

  t.deepEqual(expression, {
    TableName: 'onia-table',
    ProjectionExpression: '#name0, #name1',
    ExpressionAttributeNames: {
      '#name0': 'name',
      '#name1': 'age',
    },
    ExpressionAttributeValues: undefined,
  });
});

test('compiles multiple expressions', function (t) {
  const builder = new ExpressionBuilder('onia-table');

  const update = new UpdateExpression().set('name', 'spri');

  const projection = new ProjectionExpression().add('name', 'age');

  const expression = builder.compile((attributes) => ({
    UpdateExpression: update.serialize(attributes),
    ProjectionExpression: projection.serialize(attributes),
  }));

  t.deepEqual(expression, {
    TableName: 'onia-table',
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
