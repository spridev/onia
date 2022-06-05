import anyTest, { TestFn } from 'ava';

import {
  AdminCreateUserCommand,
  AdminDeleteUserCommand,
  AdminGetUserCommand,
  AdminInitiateAuthCommand,
  AdminSetUserPasswordCommand,
  CognitoIdentityProviderClient,
  ListUsersCommand,
  UpdateUserPoolClientCommand,
} from '@aws-sdk/client-cognito-identity-provider';

import { ClientMock, ClientType } from '@onia/mock';

import * as sinon from 'sinon';

import { CognitoPool } from '../../src';

interface TestContext {
  mock: ClientType<CognitoIdentityProviderClient>;
}

const test = anyTest as TestFn<TestContext>;

test.beforeEach(function (t) {
  t.context.mock = new ClientMock(CognitoIdentityProviderClient);
});

test.afterEach.always(function (t) {
  t.context.mock.restore();
});

test('sets up the pool', async function (t) {
  const pool = new CognitoPool('pool', 'client');

  const updateMock = sinon.stub(pool, 'updateFlows').resolves();

  t.teardown(() => updateMock.restore());

  await pool.setup();

  t.is(updateMock.callCount, 1);

  t.assert(
    updateMock.calledWith([
      'ALLOW_REFRESH_TOKEN_AUTH',
      'ALLOW_ADMIN_USER_PASSWORD_AUTH',
    ])
  );
});

test('sets up the pool with custom flows', async function (t) {
  const pool = new CognitoPool('pool', 'client', ['ALLOW_USER_PASSWORD_AUTH']);

  const updateMock = sinon.stub(pool, 'updateFlows').resolves();

  t.teardown(() => updateMock.restore());

  await pool.setup();

  t.is(updateMock.callCount, 1);

  t.assert(
    updateMock.calledWith([
      'ALLOW_USER_PASSWORD_AUTH',
      'ALLOW_ADMIN_USER_PASSWORD_AUTH',
    ])
  );
});

test('tears down the pool', async function (t) {
  const pool = new CognitoPool('pool', 'client');

  const updateMock = sinon.stub(pool, 'updateFlows').resolves();
  const deleteMock = sinon.stub(pool, 'deleteUsers').resolves();

  t.teardown(() => {
    updateMock.restore();
    deleteMock.restore();
  });

  await pool.teardown();

  t.is(updateMock.callCount, 1);
  t.is(deleteMock.callCount, 1);

  t.assert(updateMock.calledWith(['ALLOW_REFRESH_TOKEN_AUTH']));
});

test('tears down the pool with custom flows', async function (t) {
  const pool = new CognitoPool('pool', 'client', ['ALLOW_USER_PASSWORD_AUTH']);

  const updateMock = sinon.stub(pool, 'updateFlows').resolves();
  const deleteMock = sinon.stub(pool, 'deleteUsers').resolves();

  t.teardown(() => {
    updateMock.restore();
    deleteMock.restore();
  });

  await pool.teardown();

  t.is(updateMock.callCount, 1);
  t.is(deleteMock.callCount, 1);

  t.assert(updateMock.calledWith(['ALLOW_USER_PASSWORD_AUTH']));
});

test('updates the pool authentication flows', async function (t) {
  const { mock } = t.context;

  mock.on(UpdateUserPoolClientCommand).resolves({});

  const pool = new CognitoPool('pool', 'client');

  await pool.updateFlows(['ALLOW_USER_PASSWORD_AUTH']);

  t.is(mock.count(), 1);

  t.like(mock.call(0), {
    UserPoolId: 'pool',
    ClientId: 'client',
    ExplicitAuthFlows: ['ALLOW_USER_PASSWORD_AUTH'],
  });
});

test('creates a user', async function (t) {
  const { mock } = t.context;

  mock.on(AdminCreateUserCommand).resolves({ User: { Username: '1234' } });

  mock.on(AdminSetUserPasswordCommand).resolves({});

  mock.on(AdminInitiateAuthCommand).resolves({
    AuthenticationResult: {
      AccessToken: 'access-token',
      RefreshToken: 'refresh-token',
    },
  });

  const pool = new CognitoPool('pool', 'client');

  const user = await pool.createUser('username', 'password');

  t.like(user, {
    id: '1234',
    username: 'username',
    password: 'password',
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
  });

  t.is(mock.count(), 3);

  t.like(mock.call(0), {
    UserPoolId: 'pool',
    Username: 'username',
  });

  t.like(mock.call(1), {
    UserPoolId: 'pool',
    Username: 'username',
    Password: 'password',
  });

  t.like(mock.call(2), {
    UserPoolId: 'pool',
    ClientId: 'client',
    AuthFlow: 'ADMIN_USER_PASSWORD_AUTH',
    AuthParameters: {
      USERNAME: 'username',
      PASSWORD: 'password',
    },
  });
});

test('deletes a user', async function (t) {
  const { mock } = t.context;

  mock.on(AdminDeleteUserCommand).resolves({});

  const pool = new CognitoPool('pool', 'client');

  await pool.deleteUser('username');

  t.is(mock.count(), 1);

  t.like(mock.call(0), {
    UserPoolId: 'pool',
    Username: 'username',
  });
});

test('deletes all users', async function (t) {
  const { mock } = t.context;

  mock
    .on(ListUsersCommand)
    .onCall(0)
    .resolves({
      Users: [{ Username: 'a' }, { Username: 'b' }],
      PaginationToken: 'token-1',
    })
    .onCall(1)
    .resolves({
      Users: [{ Username: 'c' }, { Username: 'd' }],
      PaginationToken: undefined,
    });

  mock.on(AdminDeleteUserCommand).resolves({});

  const pool = new CognitoPool('pool', 'client');

  await pool.deleteUsers();

  t.is(mock.count(), 6);

  t.like(mock.call(0), {
    UserPoolId: 'pool',
    PaginationToken: undefined,
  });

  t.like(mock.call(3), {
    UserPoolId: 'pool',
    PaginationToken: 'token-1',
  });
});

test('returns true when the user exists', async function (t) {
  const { mock } = t.context;

  mock.on(AdminGetUserCommand).resolves({
    Username: 'username',
  });

  const pool = new CognitoPool('pool', 'client');

  const exists = await pool.containsUser('username');

  t.is(exists, true);
});

test('returns true when the user with the given attributes exists', async function (t) {
  const { mock } = t.context;

  mock.on(AdminGetUserCommand).resolves({
    Username: 'username',
    UserAttributes: [{ Name: 'name', Value: 'spri' }],
  });

  const pool = new CognitoPool('pool', 'client');

  const exists = await pool.containsUser('username', { name: 'spri' });

  t.is(exists, true);
});

test('returns false when getting the user fails', async function (t) {
  const { mock } = t.context;

  mock.on(AdminGetUserCommand).rejects(new Error('💩'));

  const pool = new CognitoPool('pool', 'client');

  const exists = await pool.containsUser('username');

  t.is(exists, false);
});

test('returns false when the user does not exist', async function (t) {
  const { mock } = t.context;

  mock.on(AdminGetUserCommand).rejects(new Error('💩'));

  const pool = new CognitoPool('pool', 'client');

  const exists = await pool.containsUser('username');

  t.is(exists, false);
});

test('returns false when the user has a missing attribute', async function (t) {
  const { mock } = t.context;

  mock.on(AdminGetUserCommand).resolves({
    Username: 'username',
    UserAttributes: [{ Name: 'name', Value: 'spri' }],
  });

  const pool = new CognitoPool('pool', 'client');

  const exists = await pool.containsUser('username', {
    email: 'spri@onia.dev',
  });

  t.is(exists, false);
});

test('returns false when the user has an incorrect attribute', async function (t) {
  const { mock } = t.context;

  mock.on(AdminGetUserCommand).resolves({
    Username: 'username',
    UserAttributes: [{ Name: 'name', Value: 'spri' }],
  });

  const pool = new CognitoPool('pool', 'client');

  const exists = await pool.containsUser('username', { name: 'onia' });

  t.is(exists, false);
});
