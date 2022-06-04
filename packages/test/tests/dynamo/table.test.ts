import anyTest, { TestFn } from 'ava';

import {
  BatchWriteItemCommand,
  DeleteItemCommand,
  DescribeTableCommand,
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  ScanCommand,
} from '@aws-sdk/client-dynamodb';

import { ClientMock, ClientType } from '@onia/mock';

import * as sinon from 'sinon';

import { DynamoTable } from '../../src';

interface TestContext {
  mock: ClientType<DynamoDBClient>;
}

const test = anyTest as TestFn<TestContext>;

test.beforeEach(function (t) {
  t.context.mock = new ClientMock(DynamoDBClient);
});

test.afterEach.always(function (t) {
  t.context.mock.restore();
});

test('sets up the table', async function (t) {
  const { mock } = t.context;

  const table = new DynamoTable('table');

  await table.setup();

  t.is(mock.count(), 0);
});

test('tears down the table', async function (t) {
  const table = new DynamoTable('table');

  const mock = sinon.stub(table, 'deleteItems').resolves();

  t.teardown(() => mock.restore());

  await table.teardown();

  t.is(mock.callCount, 1);
});

test('creates an item', async function (t) {
  const { mock } = t.context;

  mock.on(PutItemCommand).resolves({});

  const table = new DynamoTable('table');

  await table.createItem({ name: 'spri' });

  t.is(mock.count(), 1);

  t.like(mock.call(0), {
    TableName: 'table',
    Item: {
      name: { S: 'spri' },
    },
  });
});

test('deletes an item', async function (t) {
  const { mock } = t.context;

  mock.on(DeleteItemCommand).resolves({});

  const table = new DynamoTable('table');

  await table.deleteItem({ PK: 'x', SK: 'x' });

  t.is(mock.count(), 1);

  t.like(mock.call(0), {
    TableName: 'table',
    Key: {
      PK: { S: 'x' },
      SK: { S: 'x' },
    },
  });
});

test('deletes all items', async function (t) {
  const { mock } = t.context;

  mock.on(DescribeTableCommand).resolves({
    Table: {
      KeySchema: [
        { AttributeName: 'PK', KeyType: 'HASH' },
        { AttributeName: 'SK', KeyType: 'RANGE' },
      ],
    },
  });

  mock
    .on(ScanCommand)
    .onCall(0)
    .resolves({
      Items: [
        { PK: { S: 'a' }, SK: { S: 'a' } },
        { PK: { S: 'b' }, SK: { S: 'b' } },
      ],
      LastEvaluatedKey: { PK: { S: 'b' }, SK: { S: 'b' } },
    })
    .onCall(1)
    .resolves({
      Items: [
        { PK: { S: 'c' }, SK: { S: 'c' } },
        { PK: { S: 'd' }, SK: { S: 'd' } },
      ],
      LastEvaluatedKey: undefined,
    });

  mock.on(BatchWriteItemCommand).resolves({});

  const table = new DynamoTable('table');

  await table.deleteItems();

  t.is(mock.count(), 5);

  t.like(mock.call(0), { TableName: 'table' });

  t.like(mock.call(1), {
    TableName: 'table',
    AttributesToGet: ['PK', 'SK'],
    ExclusiveStartKey: undefined,
  });

  t.like(mock.call(2), {
    RequestItems: {
      table: [
        { DeleteRequest: { Key: { PK: { S: 'a' }, SK: { S: 'a' } } } },
        { DeleteRequest: { Key: { PK: { S: 'b' }, SK: { S: 'b' } } } },
      ],
    },
  });

  t.like(mock.call(3), {
    TableName: 'table',
    AttributesToGet: ['PK', 'SK'],
    ExclusiveStartKey: { PK: { S: 'b' }, SK: { S: 'b' } },
  });

  t.like(mock.call(4), {
    RequestItems: {
      table: [
        { DeleteRequest: { Key: { PK: { S: 'c' }, SK: { S: 'c' } } } },
        { DeleteRequest: { Key: { PK: { S: 'd' }, SK: { S: 'd' } } } },
      ],
    },
  });
});

test('returns true when the item exists', async function (t) {
  const { mock } = t.context;

  mock.on(GetItemCommand).resolves({
    Item: {
      name: { S: 'spri' },
    },
  });

  const table = new DynamoTable('table');

  const exists = await table.containsItem({ PK: 'x', SK: 'x' });

  t.is(exists, true);
});

test('returns true when the item with the given attributes exists', async function (t) {
  const { mock } = t.context;

  mock.on(GetItemCommand).resolves({
    Item: {
      name: { S: 'spri' },
    },
  });

  const table = new DynamoTable('table');

  const exists = await table.containsItem(
    {
      PK: 'x',
      SK: 'x',
    },
    {
      name: 'spri',
    }
  );

  t.is(exists, true);
});

test('returns false when getting the item fails', async function (t) {
  const { mock } = t.context;

  mock.on(GetItemCommand).rejects(new Error('💩'));

  const table = new DynamoTable('table');

  const exists = await table.containsItem({ PK: 'x', SK: 'x' });

  t.is(exists, false);
});

test('returns false when the item does not exist', async function (t) {
  const { mock } = t.context;

  mock.on(GetItemCommand).resolves({
    Item: undefined,
  });

  const table = new DynamoTable('table');

  const exists = await table.containsItem({ PK: 'x', SK: 'x' });

  t.is(exists, false);
});

test('returns false when the item has a missing attribute', async function (t) {
  const { mock } = t.context;

  mock.on(GetItemCommand).resolves({
    Item: {
      name: { S: 'spri' },
    },
  });

  const table = new DynamoTable('table');

  const exists = await table.containsItem(
    {
      PK: 'x',
      SK: 'x',
    },
    {
      email: 'spri@onia.dev',
    }
  );

  t.is(exists, false);
});

test('returns false when the item has an incorrect attribute', async function (t) {
  const { mock } = t.context;

  mock.on(GetItemCommand).resolves({
    Item: {
      name: { S: 'spri' },
    },
  });

  const table = new DynamoTable('table');

  const exists = await table.containsItem(
    {
      PK: 'x',
      SK: 'x',
    },
    {
      name: 'onia',
    }
  );

  t.is(exists, false);
});
