import anyTest, { TestFn } from 'ava';

import {
  DynamoDBClient,
  TransactionCanceledException,
  TransactWriteItemsCommand,
  TransactWriteItemsCommandInput,
} from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';

import { ConditionExpression, UpdateExpression } from '@onia/dino';
import { ClientMock, ClientType } from '@onia/mock';

import { AtomicWrite, hash } from '../src';

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

test('writes multiple items', async function (t) {
  const { mock } = t.context;

  mock.on(TransactWriteItemsCommand).resolves({});

  const write = new AtomicWrite(ddb)
    .put({
      TableName: 'onia',
      Item: marshall({ PK: '1' }),
    })
    .update({
      TableName: 'onia',
      Key: marshall({ PK: '2' }),
      UpdateExpression: new UpdateExpression().set('name', 'duck'),
    })
    .delete({
      TableName: 'duck',
      Key: marshall({ PK: '3' }),
    })
    .condition({
      TableName: 'duck',
      Key: marshall({ PK: '4' }),
      ConditionExpression: new ConditionExpression().exists('PK'),
    });

  await write.commit();

  t.deepEqual(mock.call(0), {
    TransactItems: [
      {
        Put: {
          TableName: 'onia',
          Item: { PK: { S: '1' } },
        },
      },
      {
        Update: {
          TableName: 'onia',
          Key: { PK: { S: '2' } },
          UpdateExpression: 'SET #name0 = :value1',
          ExpressionAttributeNames: { '#name0': 'name' },
          ExpressionAttributeValues: { ':value1': { S: 'duck' } },
        },
      },
      {
        Delete: {
          TableName: 'duck',
          Key: { PK: { S: '3' } },
        },
      },
      {
        ConditionCheck: {
          TableName: 'duck',
          Key: { PK: { S: '4' } },
          ConditionExpression: 'attribute_exists(#name0)',
          ExpressionAttributeNames: { '#name0': 'PK' },
        },
      },
    ],
  });
});

test('sets the transaction token', async function (t) {
  const { mock } = t.context;

  mock.on(TransactWriteItemsCommand).resolves({});

  const write = new AtomicWrite(ddb)
    .put({ TableName: 'onia', Item: marshall({ PK: '1' }) })
    .put({ TableName: 'onia', Item: marshall({ PK: '2' }) });

  const tokens = [
    'a',
    'a-short-token',
    'a-very-long-and-boring-token-which-exceeds-36-characters',
  ];

  for (const token of tokens) {
    await write.token(token).commit();

    const input = mock.last() as TransactWriteItemsCommandInput;

    t.is(input.ClientRequestToken, hash(token));

    t.assert(input.ClientRequestToken.length >= 5);
    t.assert(input.ClientRequestToken.length <= 36);
  }
});

test('returns early when the inputs are empty', async function (t) {
  const { mock } = t.context;

  mock.on(TransactWriteItemsCommand).resolves({});

  const write = new AtomicWrite(ddb);

  await write.commit();

  t.is(mock.count(), 0);
});

test('throws when the collection size limit is exceeded', async function (t) {
  const { mock } = t.context;

  mock.on(TransactWriteItemsCommand).resolves({});

  const write = new AtomicWrite(ddb);

  for (let index = 0; index < 101; index++) {
    write.put({ TableName: 'onia', Item: marshall({ PK: String(index) }) });
  }

  await t.throwsAsync(() => write.commit(), {
    message: 'Collection size limit exceeded',
  });

  t.is(mock.count(), 0);
});

test('handles transaction cancellation', async function (t) {
  const { mock } = t.context;

  const error = new TransactionCanceledException({
    $metadata: {},
    CancellationReasons: [{ Code: undefined }, { Code: 'duck' }],
  });

  mock.on(TransactWriteItemsCommand).rejects(error);

  const write = new AtomicWrite(ddb)
    .put(
      { TableName: 'onia', Item: marshall({ PK: '1' }) },
      {
        onError() {
          t.fail();
        },
      }
    )
    .put(
      { TableName: 'onia', Item: marshall({ PK: '2' }) },
      {
        onError(reason) {
          t.is(reason.Code, 'duck');
        },
      }
    );

  await t.throwsAsync(() => write.commit(), { is: error });

  t.plan(2);
});

test('ignores transaction cancellation when the reasons are empty', async function (t) {
  const { mock } = t.context;

  const error = new TransactionCanceledException({
    $metadata: {},
    CancellationReasons: undefined,
  });

  mock.on(TransactWriteItemsCommand).rejects(error);

  const write = new AtomicWrite(ddb)
    .put({ TableName: 'onia', Item: marshall({ PK: '1' }) })
    .put({ TableName: 'onia', Item: marshall({ PK: '2' }) });

  await t.throwsAsync(() => write.commit(), { is: error });
});
