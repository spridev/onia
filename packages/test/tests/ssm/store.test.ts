import anyTest, { TestFn } from 'ava';

import {
  DescribeParametersCommand,
  GetParametersCommand,
  SSMClient,
} from '@aws-sdk/client-ssm';

import { ClientMock, ClientType } from '@onia/mock';

import { SSMStore } from '../../src';

interface TestContext {
  mock: ClientType<SSMClient>;
}

const test = anyTest as TestFn<TestContext>;

test.beforeEach(function (t) {
  t.context.mock = new ClientMock(SSMClient);
});

test.afterEach.always(function (t) {
  t.context.mock.restore();
});

test('sets up the ssm store', async function (t) {
  const { mock } = t.context;

  mock
    .on(DescribeParametersCommand)
    .onCall(0)
    .resolves({
      Parameters: [{ Name: '/dev/a' }, { Name: '/dev/b' }],
      NextToken: 'token-1',
    })
    .onCall(1)
    .resolves({
      Parameters: [{ Name: '/dev/c' }, { Name: '/dev/d' }],
      NextToken: undefined,
    });

  mock
    .on(GetParametersCommand)
    .onCall(0)
    .resolves({
      Parameters: [
        { Name: '/dev/a', Value: '1' },
        { Name: '/dev/b', Value: '2' },
      ],
    })
    .onCall(1)
    .resolves({
      Parameters: [
        { Name: '/dev/c', Value: '3' },
        { Name: '/dev/d', Value: '4' },
      ],
    });

  const store = new SSMStore('/dev');

  await store.setup();

  t.deepEqual(store.getParameters(), {
    '/a': '1',
    '/b': '2',
    '/c': '3',
    '/d': '4',
  });

  t.is(mock.count(), 4);

  t.like(mock.call(0), { NextToken: undefined });
  t.like(mock.call(1), { Names: ['/dev/a', '/dev/b'] });
  t.like(mock.call(2), { NextToken: 'token-1' });
  t.like(mock.call(3), { Names: ['/dev/c', '/dev/d'] });
});

test('tears down the ssm store', async function (t) {
  const { mock } = t.context;

  const store = new SSMStore('/dev');

  await store.teardown();

  t.is(mock.count(), 0);
});
