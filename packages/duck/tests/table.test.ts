import anyTest, { TestFn } from 'ava';

import {
  DeleteItemCommand,
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  QueryCommand,
  ScanCommand,
  UpdateItemCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';

import { ClientMock, ClientType } from '@onia/mock';

import { Table, collect } from '../src';

interface Item {
  name: string;
}

interface TestContext {
  mock: ClientType<DynamoDBClient>;
}

const ddb = new DynamoDBClient({});

const test = anyTest as TestFn<TestContext>;

test.beforeEach(function (t) {
  t.context.mock = new ClientMock(DynamoDBClient);
});

test.afterEach.always(function (t) {
  t.context.mock.restore();
});

test('creates a new table', function (t) {
  const table = new Table(ddb, 'onia');

  t.assert(table instanceof Table);

  t.is(table.name, 'onia');
});

test('throws when the table name is missing', function (t) {
  t.throws(() => new Table(ddb, undefined), { message: 'Missing table name' });
});

test('gets an item', async function (t) {
  const { mock } = t.context;

  mock.on(GetItemCommand).resolves({
    Item: {
      name: { S: 'duck' },
    },
  });

  const table = new Table(ddb, 'onia');

  const item = await table.get<Item>({
    Key: marshall({ PK: 'PK' }),
  });

  t.deepEqual(item, { name: 'duck' });

  t.deepEqual(mock.call(0), {
    TableName: 'onia',
    Key: { PK: { S: 'PK' } },
  });
});

test('returns undefined when the item does not exist', async function (t) {
  const { mock } = t.context;

  mock.on(GetItemCommand).resolves({
    Item: undefined,
  });

  const table = new Table(ddb, 'onia');

  const item = await table.get<Item>({
    Key: marshall({ PK: 'PK' }),
  });

  t.is(item, undefined);

  t.deepEqual(mock.call(0), {
    TableName: 'onia',
    Key: { PK: { S: 'PK' } },
  });
});

test('creates an item', async function (t) {
  const { mock } = t.context;

  mock.on(PutItemCommand).resolves({
    Attributes: {
      name: { S: 'duck' },
    },
  });

  const table = new Table(ddb, 'onia');

  const item = await table.put<Item>({
    Item: marshall({ PK: 'PK' }),
  });

  t.deepEqual(item, { name: 'duck' });

  t.deepEqual(mock.call(0), {
    TableName: 'onia',
    Item: { PK: { S: 'PK' } },
  });
});

test('creates an item without returning any attributes', async function (t) {
  const { mock } = t.context;

  mock.on(PutItemCommand).resolves({
    Attributes: undefined,
  });

  const table = new Table(ddb, 'onia');

  const item = await table.put<Item>({
    Item: marshall({ PK: 'PK' }),
  });

  t.deepEqual(item, {});

  t.deepEqual(mock.call(0), {
    TableName: 'onia',
    Item: { PK: { S: 'PK' } },
  });
});

test('updates an item', async function (t) {
  const { mock } = t.context;

  mock.on(UpdateItemCommand).resolves({
    Attributes: {
      name: { S: 'duck' },
    },
  });

  const table = new Table(ddb, 'onia');

  const item = await table.update<Item>({
    Key: marshall({ PK: 'PK' }),
  });

  t.deepEqual(item, { name: 'duck' });

  t.deepEqual(mock.call(0), {
    TableName: 'onia',
    Key: { PK: { S: 'PK' } },
  });
});

test('updates an item without returning any attributes', async function (t) {
  const { mock } = t.context;

  mock.on(UpdateItemCommand).resolves({
    Attributes: undefined,
  });

  const table = new Table(ddb, 'onia');

  const item = await table.update<Item>({
    Key: marshall({ PK: 'PK' }),
  });

  t.deepEqual(item, {});

  t.deepEqual(mock.call(0), {
    TableName: 'onia',
    Key: { PK: { S: 'PK' } },
  });
});

test('deletes an item', async function (t) {
  const { mock } = t.context;

  mock.on(DeleteItemCommand).resolves({
    Attributes: {
      name: { S: 'duck' },
    },
  });

  const table = new Table(ddb, 'onia');

  const item = await table.delete<Item>({
    Key: marshall({ PK: 'PK' }),
  });

  t.deepEqual(item, { name: 'duck' });

  t.deepEqual(mock.call(0), {
    TableName: 'onia',
    Key: { PK: { S: 'PK' } },
  });
});

test('deletes an item without returning any attributes', async function (t) {
  const { mock } = t.context;

  mock.on(DeleteItemCommand).resolves({
    Attributes: undefined,
  });

  const table = new Table(ddb, 'onia');

  const item = await table.delete<Item>({
    Key: marshall({ PK: 'PK' }),
  });

  t.deepEqual(item, {});

  t.deepEqual(mock.call(0), {
    TableName: 'onia',
    Key: { PK: { S: 'PK' } },
  });
});

test('scans the table items', async function (t) {
  const { mock } = t.context;

  mock
    .on(ScanCommand)
    .onCall(0)
    .resolves({
      Items: [{ PK: { S: 'A' } }, { PK: { S: 'B' } }],
      LastEvaluatedKey: { PK: { S: 'B' } },
    })
    .onCall(1)
    .resolves({
      Items: [{ PK: { S: 'C' } }, { PK: { S: 'D' } }],
      LastEvaluatedKey: undefined,
    });

  const table = new Table(ddb, 'onia');

  const items = await collect(table.scan());

  t.deepEqual(items, [{ PK: 'A' }, { PK: 'B' }, { PK: 'C' }, { PK: 'D' }]);

  t.is(mock.count(), 2);

  t.deepEqual(mock.call(0), {
    TableName: 'onia',
  });

  t.deepEqual(mock.call(1), {
    TableName: 'onia',
    ExclusiveStartKey: { PK: { S: 'B' } },
  });
});

test('queries the table items', async function (t) {
  const { mock } = t.context;

  mock
    .on(QueryCommand)
    .onCall(0)
    .resolves({
      Items: [{ PK: { S: 'A' } }, { PK: { S: 'B' } }],
      LastEvaluatedKey: { PK: { S: 'B' } },
    })
    .onCall(1)
    .resolves({
      Items: [{ PK: { S: 'C' } }, { PK: { S: 'D' } }],
      LastEvaluatedKey: undefined,
    });

  const table = new Table(ddb, 'onia');

  const items = await collect(table.query());

  t.deepEqual(items, [{ PK: 'A' }, { PK: 'B' }, { PK: 'C' }, { PK: 'D' }]);

  t.is(mock.count(), 2);

  t.deepEqual(mock.call(0), {
    TableName: 'onia',
  });

  t.deepEqual(mock.call(1), {
    TableName: 'onia',
    ExclusiveStartKey: { PK: { S: 'B' } },
  });
});
