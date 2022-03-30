import anyTest, { TestFn } from 'ava';

import {
  CreateQueueCommand,
  DeleteQueueCommand,
  ListQueuesCommand,
  SQSClient,
} from '@aws-sdk/client-sqs';

import { ClientMock, ClientType } from '../src';

const createCommand = new CreateQueueCommand({ QueueName: 'onia' });
const deleteCommand = new DeleteQueueCommand({ QueueUrl: 'onia' });

const listOneCommand = new ListQueuesCommand({ MaxResults: 1 });
const listTwoCommand = new ListQueuesCommand({ MaxResults: 2 });

interface TestContext {
  mock: ClientType<SQSClient>;
}

const test = anyTest as TestFn<TestContext>;

test.beforeEach(function (t) {
  t.context.mock = new ClientMock(SQSClient);
});

test.afterEach.always(function (t) {
  t.context.mock.restore();
});

// Mock

test('returns the underlying sinon stub', function (t) {
  t.truthy(t.context.mock.stub());
});

test('returns the number of recorded calls', async function (t) {
  const { mock } = t.context;

  const client = new SQSClient({});

  mock.on(CreateQueueCommand).resolves({});
  mock.on(DeleteQueueCommand).resolves({});

  t.is(mock.count(), 0);

  await client.send(createCommand);

  t.is(mock.count(), 1);

  await client.send(deleteCommand);

  t.is(mock.count(), 2);
});

test('returns true if the stub was called at least once', async function (t) {
  const { mock } = t.context;

  const client = new SQSClient({});

  mock.on(CreateQueueCommand).resolves({});

  t.false(mock.called());

  await client.send(createCommand);

  t.true(mock.called());
});

test('returns all recorded calls', async function (t) {
  const { mock } = t.context;

  const client = new SQSClient({});

  mock.on(CreateQueueCommand).resolves({});
  mock.on(DeleteQueueCommand).resolves({});

  await client.send(createCommand);
  await client.send(deleteCommand);

  t.deepEqual(mock.calls(), [createCommand.input, deleteCommand.input]);
});

test('returns the nth recorded call', async function (t) {
  const { mock } = t.context;

  const client = new SQSClient({});

  mock.on(ListQueuesCommand).resolves({});

  await client.send(listOneCommand);
  await client.send(listTwoCommand);

  t.like(mock.call(0), listOneCommand.input);
  t.like(mock.call(1), listTwoCommand.input);

  t.is(mock.call(2), undefined);
  t.is(mock.call(3), undefined);
});

// Client

test('resets the stub history', async function (t) {
  const { mock } = t.context;

  const client = new SQSClient({});

  mock.on(CreateQueueCommand).resolves({});

  t.is(mock.count(), 0);

  await client.send(createCommand);

  t.is(mock.count(), 1);

  mock.reset();

  t.is(mock.count(), 0);
});

test('restores the stub behavior', async function (t) {
  const { mock } = t.context;

  const client = new SQSClient({});

  const createResponse = { QueueUrl: 'queue-url' };

  mock.on(CreateQueueCommand).resolves(createResponse);

  t.like(await client.send(createCommand), createResponse);

  mock.restore();

  try {
    t.not(await client.send(createCommand), createResponse);
  } catch {
    t.pass();
  }
});

test('restores the stub behavior if the client is already mocked', async function (t) {
  const { mock } = t.context;

  const client = new SQSClient({});

  const createResponse = { QueueUrl: 'queue-url' };

  mock.on(CreateQueueCommand).resolves(createResponse);

  t.like(await client.send(createCommand), createResponse);

  new ClientMock(SQSClient);

  try {
    t.not(await client.send(createCommand), createResponse);
  } catch {
    t.pass();
  }
});

test('defines the command behavior by type', async function (t) {
  const { mock } = t.context;

  const client = new SQSClient({});

  const createResponse = { QueueUrl: 'queue-url' };
  const deleteResponse = { $metadata: { attempts: 1 } };

  mock.on(CreateQueueCommand).resolves(createResponse);
  mock.on(DeleteQueueCommand).resolves(deleteResponse);

  t.like(await client.send(createCommand), createResponse);
  t.like(await client.send(deleteCommand), deleteResponse);
});

test('defines the command behavior by input', async function (t) {
  const { mock } = t.context;

  const client = new SQSClient({});

  const listOneResponse = { QueueUrls: ['1'] };
  const listTwoResponse = { QueueUrls: ['2'] };

  mock.on(ListQueuesCommand, listOneCommand.input).resolves(listOneResponse);
  mock.on(ListQueuesCommand, listTwoCommand.input).resolves(listTwoResponse);

  t.like(await client.send(listOneCommand), listOneResponse);
  t.like(await client.send(listTwoCommand), listTwoResponse);
});
