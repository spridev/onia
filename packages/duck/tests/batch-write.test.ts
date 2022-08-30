import anyTest, { TestFn } from 'ava';

import {
  BatchWriteItemCommand,
  BatchWriteItemCommandInput,
  DynamoDBClient,
  WriteRequest,
} from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';

import { ClientMock, ClientType } from '@onia/mock';

import { BatchWrite } from '../src';

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

test('writes multiple items in batches', async function (t) {
  const { mock } = t.context;

  const count = 110;

  mock.on(BatchWriteItemCommand).resolves({ UnprocessedItems: undefined });

  const write = new BatchWrite(ddb);

  for (let index = 0; index < count; index++) {
    if (index % 3 === 0) {
      write.put('onia', { Item: marshall({ PK: String(index) }) });
    } else {
      write.delete('duck', { Key: marshall({ PK: String(index) }) });
    }
  }

  await write.exec();

  t.is(mock.count(), Math.ceil(count / 25));

  const seen = new Set<number>();

  for (const call of mock.calls()) {
    const input = call as BatchWriteItemCommandInput;

    for (const [table, items] of Object.entries(input.RequestItems)) {
      for (const item of items) {
        const index = item.PutRequest
          ? Number.parseInt(item.PutRequest.Item.PK.S)
          : Number.parseInt(item.DeleteRequest.Key.PK.S);

        t.is(seen.has(index), false);

        seen.add(index);

        if (index % 3 === 0) {
          t.is(table, 'onia');
        } else {
          t.is(table, 'duck');
        }
      }
    }
  }

  t.is(seen.size, count);
});

test('retries unprocessed items', async function (t) {
  const { mock } = t.context;

  const count = 100;
  const failures = new Set([12, 45, 61, 98, 99]);
  const unprocessed = new Map<number, WriteRequest>();

  mock.on(BatchWriteItemCommand).handle((input) => {
    const output: Record<string, WriteRequest[]> = {};

    for (const [table, items] of Object.entries(input.RequestItems)) {
      for (const item of items) {
        const index = item.PutRequest
          ? Number.parseInt(item.PutRequest.Item.PK.S)
          : Number.parseInt(item.DeleteRequest.Key.PK.S);

        if (unprocessed.has(index)) {
          if (!output[table]) {
            output[table] = [];
          }

          output[table].push(unprocessed.get(index));

          unprocessed.delete(index);
        }
      }
    }

    return { UnprocessedItems: output };
  });

  const write = new BatchWrite(ddb);

  for (let index = 0; index < count; index++) {
    const item = marshall({ PK: String(index) });

    write.put('onia', { Item: item });

    if (failures.has(index)) {
      unprocessed.set(index, { PutRequest: { Item: item } });
    }
  }

  await write.exec();

  t.is(mock.count(), Math.ceil(count / 25) + Math.ceil(failures.size / 25));

  const counters: number[] = [];

  for (const call of mock.calls()) {
    const input = call as BatchWriteItemCommandInput;

    for (const items of Object.values(input.RequestItems)) {
      for (const item of items) {
        const index = item.PutRequest
          ? Number.parseInt(item.PutRequest.Item.PK.S)
          : Number.parseInt(item.DeleteRequest.Key.PK.S);

        if (!counters[index]) {
          counters[index] = 0;
        }

        counters[index]++;
      }
    }
  }

  t.is(counters.length, count);

  for (const [index, counter] of counters.entries()) {
    t.is(counter, failures.has(index) ? 2 : 1);
  }
});
