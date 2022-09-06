import anyTest, { TestFn } from 'ava';

import {
  DynamoDBClient,
  TransactGetItemsCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';

import { ClientMock, ClientType } from '@onia/mock';

import { AtomicRead } from '../src';

interface Item {
  PK: string;
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

test('returns multiple items', async function (t) {
  const { mock } = t.context;

  mock.on(TransactGetItemsCommand).resolves({
    Responses: [
      { Item: { PK: { S: '1' } } },
      { Item: { PK: { S: '2' } } },
      { Item: undefined },
    ],
  });

  const read = new AtomicRead(ddb)
    .get({ TableName: 'onia', Key: marshall({ PK: '1' }) })
    .get({ TableName: 'onia', Key: marshall({ PK: '2' }) })
    .get({ TableName: 'duck', Key: marshall({ PK: '3' }) });

  const items = await read.commit<Item>();

  t.deepEqual(items, [{ PK: '1' }, { PK: '2' }, undefined]);

  t.deepEqual(mock.call(0), {
    TransactItems: [
      {
        Get: {
          TableName: 'onia',
          Key: { PK: { S: '1' } },
        },
      },
      {
        Get: {
          TableName: 'onia',
          Key: { PK: { S: '2' } },
        },
      },
      {
        Get: {
          TableName: 'duck',
          Key: { PK: { S: '3' } },
        },
      },
    ],
  });
});

test('returns an empty array when the inputs are empty', async function (t) {
  const { mock } = t.context;

  mock.on(TransactGetItemsCommand).resolves({});

  const read = new AtomicRead(ddb);

  const items = await read.commit<Item>();

  t.deepEqual(items, []);

  t.is(mock.count(), 0);
});

test('returns an empty array when the responses are empty', async function (t) {
  const { mock } = t.context;

  mock.on(TransactGetItemsCommand).resolves({
    Responses: undefined,
  });

  const read = new AtomicRead(ddb)
    .get({ TableName: 'onia', Key: marshall({ PK: '1' }) })
    .get({ TableName: 'onia', Key: marshall({ PK: '2' }) })
    .get({ TableName: 'duck', Key: marshall({ PK: '3' }) });

  const items = await read.commit<Item>();

  t.deepEqual(items, []);

  t.is(mock.count(), 1);
});

test('throws when the collection size limit is exceeded', async function (t) {
  const { mock } = t.context;

  mock.on(TransactGetItemsCommand).resolves({});

  const read = new AtomicRead(ddb);

  for (let index = 0; index < 101; index++) {
    read.get({ TableName: 'onia', Key: marshall({ PK: String(index) }) });
  }

  await t.throwsAsync(() => read.commit<Item>(), {
    message: 'Collection size limit exceeded',
  });

  t.is(mock.count(), 0);
});
