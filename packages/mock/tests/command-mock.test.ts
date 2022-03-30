import anyTest, { TestFn } from 'ava';

import {
  CreateBucketCommand,
  DeleteBucketCommand,
  HeadBucketCommand,
  S3Client,
} from '@aws-sdk/client-s3';

import { ClientMock, ClientType } from '../src';

const createCommand = new CreateBucketCommand({ Bucket: 'onia' });
const deleteCommand = new DeleteBucketCommand({ Bucket: 'onia' });

const headOneCommand = new HeadBucketCommand({ Bucket: 'onia-one' });
const headTwoCommand = new HeadBucketCommand({ Bucket: 'onia-two' });

interface TestContext {
  mock: ClientType<S3Client>;
}

const test = anyTest as TestFn<TestContext>;

test.beforeEach(function (t) {
  t.context.mock = new ClientMock(S3Client);
});

test.afterEach.always(function (t) {
  t.context.mock.restore();
});

// Mock

test('returns the underlying sinon stub', function (t) {
  t.truthy(t.context.mock.on(CreateBucketCommand).stub());
});

test('returns the number of recorded calls', async function (t) {
  const { mock } = t.context;

  const client = new S3Client({});

  const create = mock.on(CreateBucketCommand).resolves({});
  const remove = mock.on(DeleteBucketCommand).resolves({});

  t.is(create.count(), 0);
  t.is(remove.count(), 0);

  await client.send(createCommand);

  t.is(create.count(), 1);
  t.is(remove.count(), 0);

  await client.send(deleteCommand);

  t.is(create.count(), 1);
  t.is(remove.count(), 1);
});

test('returns true if the stub was called at least once', async function (t) {
  const { mock } = t.context;

  const client = new S3Client({});

  const create = mock.on(CreateBucketCommand).resolves({});
  const remove = mock.on(DeleteBucketCommand).resolves({});

  t.false(create.called());
  t.false(remove.called());

  await client.send(createCommand);

  t.true(create.called());
  t.false(remove.called());

  await client.send(deleteCommand);

  t.true(create.called());
  t.true(remove.called());
});

test('returns all recorded calls', async function (t) {
  const { mock } = t.context;

  const client = new S3Client({});

  const head = mock.on(HeadBucketCommand).resolves({});

  await client.send(headOneCommand);
  await client.send(headTwoCommand);

  t.deepEqual(head.calls(), [headOneCommand.input, headTwoCommand.input]);
});

test('returns the nth recorded call', async function (t) {
  const { mock } = t.context;

  const client = new S3Client({});

  const head = mock.on(HeadBucketCommand).resolves({});

  await client.send(headOneCommand);
  await client.send(headTwoCommand);

  t.like(head.call(0), headOneCommand.input);
  t.like(head.call(1), headTwoCommand.input);

  t.is(head.call(2), undefined);
  t.is(head.call(3), undefined);
});

// Command

test('makes the stub return the given value', async function (t) {
  const { mock } = t.context;

  const client = new S3Client({});

  const response = { Location: 'us-east-1' };

  mock.on(CreateBucketCommand).resolves(response);

  t.like(await client.send(createCommand), response);
});

test('makes the stub return the given error', async function (t) {
  const { mock } = t.context;

  const client = new S3Client({});

  const error = new Error('💩');

  mock.on(CreateBucketCommand).rejects(error);

  await t.throwsAsync(() => client.send(createCommand), { is: error });
});

test('makes the stub call the provided function', async function (t) {
  const { mock } = t.context;

  const client = new S3Client({});

  const response = { Location: 'us-east-1' };

  mock.on(CreateBucketCommand).handle(function (input) {
    t.like(input, createCommand.input);

    return response;
  });

  t.like(await client.send(createCommand), response);
});

test('defines the command behavior on the nth call', async function (t) {
  const { mock } = t.context;

  const client = new S3Client({});

  mock
    .on(CreateBucketCommand)
    .resolves({ Location: 'x' })
    .onCall(0)
    .resolves({ Location: '0' })
    .onCall(1)
    .resolves({ Location: '1' });

  t.like(await client.send(createCommand), { Location: '0' });
  t.like(await client.send(createCommand), { Location: '1' });
  t.like(await client.send(createCommand), { Location: 'x' });
});
