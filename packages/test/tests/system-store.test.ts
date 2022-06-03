import anyTest, { TestFn } from 'ava';

import {
  DescribeParametersCommand,
  GetParametersCommand,
  SSMClient,
} from '@aws-sdk/client-ssm';

import { ClientMock, ClientType } from '@onia/mock';

import { SystemStore } from '../src';

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

test('gets all parameters', async function (t) {
  const { mock } = t.context;

  mock.on(DescribeParametersCommand).resolves({
    Parameters: [{ Name: '/a' }, { Name: '/b' }],
  });

  mock.on(GetParametersCommand).resolves({
    Parameters: [
      { Name: '/a', Value: '1' },
      { Name: '/b', Value: '2' },
    ],
  });

  const result = await new SystemStore().populate<{ A: string; B: string }>();

  t.deepEqual(result, {
    A: '1',
    B: '2',
  });

  t.is(mock.count(), 2);

  t.like(mock.call(0), { ParameterFilters: [] });
  t.like(mock.call(1), { Names: ['/a', '/b'] });
});

test('gets all parameters with path', async function (t) {
  const { mock } = t.context;

  mock.on(DescribeParametersCommand).resolves({
    Parameters: [{ Name: '/dev/a' }, { Name: '/dev/b' }],
  });

  mock.on(GetParametersCommand).resolves({
    Parameters: [
      { Name: '/dev/a', Value: '1' },
      { Name: '/dev/b', Value: '2' },
    ],
  });

  const result = await new SystemStore('/dev').populate();

  t.deepEqual(result, {
    A: '1',
    B: '2',
  });

  t.is(mock.count(), 2);

  t.like(mock.call(0), {
    ParameterFilters: [
      {
        Key: 'Name',
        Option: 'BeginsWith',
        Values: ['/dev'],
      },
    ],
  });

  t.like(mock.call(1), { Names: ['/dev/a', '/dev/b'] });
});

test('gets all parameters in multiple batches', async function (t) {
  const { mock } = t.context;

  mock
    .on(DescribeParametersCommand)
    .onCall(0)
    .resolves({
      Parameters: [{ Name: '/a' }, { Name: '/b' }],
      NextToken: 'token-1',
    })
    .onCall(1)
    .resolves({
      Parameters: [{ Name: '/c' }, { Name: '/d' }],
      NextToken: 'token-2',
    })
    .onCall(2)
    .resolves({
      Parameters: undefined,
    });

  mock.on(GetParametersCommand).resolves({
    Parameters: [
      { Name: '/a', Value: '1' },
      { Name: '/b', Value: '2' },
      { Name: '/c', Value: '3' },
      { Name: '/d', Value: '4' },
    ],
  });

  const result = await new SystemStore().populate();

  t.deepEqual(result, {
    A: '1',
    B: '2',
    C: '3',
    D: '4',
  });

  t.is(mock.count(), 4);

  t.like(mock.call(0), { NextToken: undefined });
  t.like(mock.call(1), { NextToken: 'token-1' });
  t.like(mock.call(2), { NextToken: 'token-2' });
  t.like(mock.call(3), { Names: ['/a', '/b', '/c', '/d'] });
});

test('formats configuration keys', async function (t) {
  const { mock } = t.context;

  mock.on(DescribeParametersCommand).resolves({
    Parameters: [
      { Name: '/dev/api/url' },
      { Name: '/dev/api/arn' },
      { Name: '/dev/user-table/name' },
    ],
  });

  mock.on(GetParametersCommand).resolves({
    Parameters: [
      { Name: '/dev/api/url', Value: '1' },
      { Name: '/dev/api/arn', Value: '2' },
      { Name: '/dev/user-table/name', Value: '3' },
    ],
  });

  const result = await new SystemStore('/dev').populate();

  t.deepEqual(result, {
    API_URL: '1',
    API_ARN: '2',
    USER_TABLE_NAME: '3',
  });
});

test('formats configuration keys with custom prefix', async function (t) {
  const { mock } = t.context;

  mock.on(DescribeParametersCommand).resolves({
    Parameters: [
      { Name: '/dev/api/url' },
      { Name: '/dev/api/arn' },
      { Name: '/dev/user-table/name' },
    ],
  });

  mock.on(GetParametersCommand).resolves({
    Parameters: [
      { Name: '/dev/api/url', Value: '1' },
      { Name: '/dev/api/arn', Value: '2' },
      { Name: '/dev/user-table/name', Value: '3' },
    ],
  });

  const result = await new SystemStore('/dev').populate('/onia');

  t.deepEqual(result, {
    ONIA_API_URL: '1',
    ONIA_API_ARN: '2',
    ONIA_USER_TABLE_NAME: '3',
  });
});

test('does not override existing environment variables', async function (t) {
  const { mock } = t.context;

  mock.on(DescribeParametersCommand).resolves({
    Parameters: [{ Name: '/a' }, { Name: '/b' }],
  });

  mock.on(GetParametersCommand).resolves({
    Parameters: [
      { Name: '/a', Value: '1' },
      { Name: '/b', Value: '2' },
    ],
  });

  delete process.env.A;
  delete process.env.B;

  process.env.B = 'X';

  const result = await new SystemStore().populate();

  t.deepEqual(result, {
    A: '1',
    B: '2',
  });

  t.like(process.env, {
    A: '1',
    B: 'X',
  });
});

test('ignores parameters with empty names', async function (t) {
  const { mock } = t.context;

  mock.on(DescribeParametersCommand).resolves({
    Parameters: [{ Name: '/x' }],
  });

  mock.on(GetParametersCommand).resolves({
    Parameters: [{ Value: 'x' }],
  });

  const result = await new SystemStore().populate();

  t.deepEqual(result, {});
});

test('ignores parameters with empty values', async function (t) {
  const { mock } = t.context;

  mock.on(DescribeParametersCommand).resolves({
    Parameters: [{ Name: '/x' }],
  });

  mock.on(GetParametersCommand).resolves({
    Parameters: [{ Name: '/x' }],
  });

  const result = await new SystemStore().populate();

  t.deepEqual(result, {});
});
