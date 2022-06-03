import anyTest, { TestFn } from 'ava';

import {
  AdminCreateUserCommand,
  AdminDeleteUserCommand,
  AdminGetUserCommand,
  AdminInitiateAuthCommand,
  AdminSetUserPasswordCommand,
  CognitoIdentityProviderClient,
  UpdateUserPoolClientCommand,
} from '@aws-sdk/client-cognito-identity-provider';

import { ClientMock, ClientType } from '@onia/mock';

import { CognitoTester, CognitoUser } from '../src';

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

test('sets up the tester', async function (t) {
  const { mock } = t.context;

  mock.on(UpdateUserPoolClientCommand).resolves({});

  const tester = new CognitoTester('user-pool', 'client');

  await tester.setup();

  t.is(mock.count(), 1);

  t.like(mock.call(0), {
    UserPoolId: 'user-pool',
    ClientId: 'client',
    ExplicitAuthFlows: [
      'ALLOW_REFRESH_TOKEN_AUTH',
      'ALLOW_ADMIN_USER_PASSWORD_AUTH',
    ],
  });
});

test('sets up the tester with custom flows', async function (t) {
  const { mock } = t.context;

  mock.on(UpdateUserPoolClientCommand).resolves({});

  const tester = new CognitoTester('user-pool', 'client', [
    'ALLOW_USER_PASSWORD_AUTH',
  ]);

  await tester.setup();

  t.is(mock.count(), 1);

  t.like(mock.call(0), {
    UserPoolId: 'user-pool',
    ClientId: 'client',
    ExplicitAuthFlows: [
      'ALLOW_USER_PASSWORD_AUTH',
      'ALLOW_ADMIN_USER_PASSWORD_AUTH',
    ],
  });
});

test('tears down the tester', async function (t) {
  const { mock } = t.context;

  mock.on(UpdateUserPoolClientCommand).resolves({});

  const tester = new CognitoTester('user-pool', 'client');

  await tester.teardown();

  t.is(mock.count(), 1);

  t.like(mock.call(0), {
    UserPoolId: 'user-pool',
    ClientId: 'client',
    ExplicitAuthFlows: ['ALLOW_REFRESH_TOKEN_AUTH'],
  });
});

test('tears down the tester with custom flows', async function (t) {
  const { mock } = t.context;

  mock.on(UpdateUserPoolClientCommand).resolves({});

  const tester = new CognitoTester('user-pool', 'client', [
    'ALLOW_USER_PASSWORD_AUTH',
  ]);

  await tester.teardown();

  t.is(mock.count(), 1);

  t.like(mock.call(0), {
    UserPoolId: 'user-pool',
    ClientId: 'client',
    ExplicitAuthFlows: ['ALLOW_USER_PASSWORD_AUTH'],
  });
});

test('creates a user', async function (t) {
  const { mock } = t.context;

  mock.on(AdminCreateUserCommand).resolves({
    User: {
      Username: '1234',
    },
  });

  mock.on(AdminSetUserPasswordCommand).resolves({});

  mock.on(AdminInitiateAuthCommand).resolves({
    AuthenticationResult: {
      AccessToken: 'access-token',
      RefreshToken: 'refresh-token',
    },
  });

  const tester = new CognitoTester('user-pool', 'client');

  const user = await tester.createUser('username', 'password');

  t.deepEqual(user, {
    id: '1234',
    username: 'username',
    password: 'password',
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
  });

  t.is(mock.count(), 3);

  t.like(mock.call(0), {
    UserPoolId: 'user-pool',
    Username: 'username',
  });

  t.like(mock.call(1), {
    UserPoolId: 'user-pool',
    Username: 'username',
    Password: 'password',
  });

  t.like(mock.call(2), {
    UserPoolId: 'user-pool',
    ClientId: 'client',
    AuthFlow: 'ADMIN_USER_PASSWORD_AUTH',
    AuthParameters: {
      USERNAME: 'username',
      PASSWORD: 'password',
    },
  });
});

test('throws when the user username is missing', async function (t) {
  const { mock } = t.context;

  mock.on(AdminCreateUserCommand).resolves({ User: {} });

  const tester = new CognitoTester('user-pool', 'client');

  await t.throwsAsync(() => tester.createUser('username', 'password'), {
    message: 'Missing username',
  });
});

test('throws when the user access token is missing', async function (t) {
  const { mock } = t.context;

  mock.on(AdminCreateUserCommand).resolves({
    User: {
      Username: '1234',
    },
  });

  mock.on(AdminSetUserPasswordCommand).resolves({});

  mock.on(AdminInitiateAuthCommand).resolves({
    AuthenticationResult: {
      RefreshToken: 'refresh-token',
    },
  });

  const tester = new CognitoTester('user-pool', 'client');

  await t.throwsAsync(() => tester.createUser('username', 'password'), {
    message: 'Missing access token',
  });
});

test('throws when the user refresh token is missing', async function (t) {
  const { mock } = t.context;

  mock.on(AdminCreateUserCommand).resolves({
    User: {
      Username: '1234',
    },
  });

  mock.on(AdminSetUserPasswordCommand).resolves({});

  mock.on(AdminInitiateAuthCommand).resolves({
    AuthenticationResult: {
      AccessToken: 'access-token',
    },
  });

  const tester = new CognitoTester('user-pool', 'client');

  await t.throwsAsync(() => tester.createUser('username', 'password'), {
    message: 'Missing refresh token',
  });
});

test('returns true when the user exists', async function (t) {
  const { mock } = t.context;

  mock.on(AdminGetUserCommand).resolves({
    Username: 'username',
  });

  const tester = new CognitoTester('user-pool', 'client');

  const matches = await tester.containsUser('username');

  t.is(matches, true);

  t.is(mock.count(), 1);

  t.like(mock.call(0), {
    UserPoolId: 'user-pool',
    Username: 'username',
  });
});

test('returns true when the user with the given attributes exists', async function (t) {
  const { mock } = t.context;

  mock.on(AdminGetUserCommand).resolves({
    Username: 'username',
    UserAttributes: [
      { Name: 'name', Value: 'spri' },
      { Name: 'email', Value: 'spri@onia.dev' },
    ],
  });

  const tester = new CognitoTester('user-pool', 'client');

  const matches = await tester.containsUser('username', {
    email: 'spri@onia.dev',
  });

  t.is(matches, true);
});

test('returns false when the user does not exist', async function (t) {
  const { mock } = t.context;

  mock.on(AdminGetUserCommand).rejects(new Error('💩'));

  const tester = new CognitoTester('user-pool', 'client');

  const matches = await tester.containsUser('username');

  t.is(matches, false);

  t.is(mock.count(), 1);

  t.like(mock.call(0), {
    UserPoolId: 'user-pool',
    Username: 'username',
  });
});

test('returns false when the user attributes are empty', async function (t) {
  const { mock } = t.context;

  mock.on(AdminGetUserCommand).resolves({
    Username: 'username',
  });

  const tester = new CognitoTester('user-pool', 'client');

  const matches = await tester.containsUser('username', {
    email: 'spri@onia.dev',
  });

  t.is(matches, false);
});

test('returns false when the user has a missing attribute', async function (t) {
  const { mock } = t.context;

  mock.on(AdminGetUserCommand).resolves({
    Username: 'username',
    UserAttributes: [{ Name: 'name', Value: 'spri' }],
  });

  const tester = new CognitoTester('user-pool', 'client');

  const matches = await tester.containsUser('username', {
    email: 'spri@onia.dev',
  });

  t.is(matches, false);
});

test('returns false when the user has an incorrect attribute', async function (t) {
  const { mock } = t.context;

  mock.on(AdminGetUserCommand).resolves({
    Username: 'username',
    UserAttributes: [{ Name: 'name', Value: 'spri' }],
  });

  const tester = new CognitoTester('user-pool', 'client');

  const matches = await tester.containsUser('username', {
    name: 'onia',
  });

  t.is(matches, false);
});

test('deletes a user', async function (t) {
  const { mock } = t.context;

  mock.on(AdminDeleteUserCommand).resolves({});

  const tester = new CognitoTester('user-pool', 'client');

  await tester.deleteUser('username');

  t.is(mock.count(), 1);

  t.like(mock.call(0), { UserPoolId: 'user-pool', Username: 'username' });
});

test('deletes all users', async function (t) {
  const { mock } = t.context;

  mock.on(AdminDeleteUserCommand).resolves({});

  const tester = new CognitoTester('user-pool', 'client');

  tester['$users'].set('1', { username: '1' } as CognitoUser);
  tester['$users'].set('2', { username: '2' } as CognitoUser);
  tester['$users'].set('3', { username: '3' } as CognitoUser);

  await tester.deleteUsers();

  t.is(mock.count(), 3);

  t.deepEqual(mock.calls(), [
    { UserPoolId: 'user-pool', Username: '1' },
    { UserPoolId: 'user-pool', Username: '2' },
    { UserPoolId: 'user-pool', Username: '3' },
  ]);
});
