import test from 'ava';

import {
  GetItemCommandInput,
  PutItemCommandInput,
  QueryCommandInput,
  UpdateItemCommandInput,
} from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';

import {
  ConditionExpression,
  ProjectionExpression,
  UpdateExpression,
  compile,
} from '../src';

test('compiles get inputs', function (t) {
  const input = compile<GetItemCommandInput>({
    TableName: 'onia-table',
    Key: marshall({ PK: 'PK' }),
    ProjectionExpression: new ProjectionExpression().add('name', 'age'),
  });

  t.deepEqual(input, {
    TableName: 'onia-table',
    Key: { PK: { S: 'PK' } },
    ProjectionExpression: '#name0, #name1',
    ExpressionAttributeNames: {
      '#name0': 'name',
      '#name1': 'age',
    },
  });
});

test('compiles put inputs', function (t) {
  const input = compile<PutItemCommandInput>({
    TableName: 'onia-table',
    Item: marshall({ name: 'spri' }),
  });

  t.deepEqual(input, {
    TableName: 'onia-table',
    Item: { name: { S: 'spri' } },
  });
});

test('compiles update inputs', function (t) {
  const input = compile<UpdateItemCommandInput>({
    TableName: 'onia-table',
    Key: marshall({ PK: 'PK' }),
    UpdateExpression: new UpdateExpression().set('age', 25),
    ConditionExpression: new ConditionExpression().where('age', '=', 24),
  });

  t.deepEqual(input, {
    TableName: 'onia-table',
    Key: { PK: { S: 'PK' } },
    UpdateExpression: 'SET #name0 = :value1',
    ConditionExpression: '#name0 = :value2',
    ExpressionAttributeNames: {
      '#name0': 'age',
    },
    ExpressionAttributeValues: {
      ':value1': { N: '25' },
      ':value2': { N: '24' },
    },
  });
});

test('compiles query inputs', function (t) {
  const input = compile<QueryCommandInput>({
    TableName: 'onia-table',
    IndexName: 'GSI1',
    FilterExpression: new ConditionExpression().contains('PK', 'Y'),
    KeyConditionExpression: new ConditionExpression().where('GSI1PK', '=', 'X'),
  });

  t.deepEqual(input, {
    TableName: 'onia-table',
    IndexName: 'GSI1',
    FilterExpression: 'contains(#name0, :value1)',
    KeyConditionExpression: '#name2 = :value3',
    ExpressionAttributeNames: {
      '#name0': 'PK',
      '#name2': 'GSI1PK',
    },
    ExpressionAttributeValues: {
      ':value1': { S: 'Y' },
      ':value3': { S: 'X' },
    },
  });
});
