import test, { ExecutionContext } from 'ava';

import { DeepPartial, LambdaWrapper } from '@onia/test';

import * as Boom from '@hapi/boom';
import * as Joi from 'joi';

import { Gate } from '../src';

import type { APIGatewayProxyEventV2 } from 'aws-lambda';

const scopes = test.macro(async function (
  t: ExecutionContext,
  route: string[] | undefined,
  event: string[] | undefined,
  code: number
) {
  const gate = new Gate({ auth: { scopes: route } });

  const handler = gate.handler(() => ({ statusCode: 200 }));

  const wrapper = LambdaWrapper.promise(handler).event(withText('onia'));

  const result = await wrapper.call({
    requestContext: {
      authorizer: {
        jwt: {
          scopes: event,
        },
      },
    },
  });

  if (typeof result === 'string') {
    return t.fail();
  }

  const { statusCode } = result ?? {};

  t.is(statusCode, code);
});

function withForm(body: string): DeepPartial<APIGatewayProxyEventV2> {
  return {
    body: body,
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
  };
}

function withJson(body: string | object): DeepPartial<APIGatewayProxyEventV2> {
  return {
    body: typeof body === 'string' ? body : JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  };
}

function withText(body: string): DeepPartial<APIGatewayProxyEventV2> {
  return {
    body: body,
    headers: { 'content-type': 'text/plain' },
  };
}

test('parses the event query', async function (t) {
  const gate = new Gate();

  const handler = gate.handler((event) => {
    t.deepEqual(event.query, { name: 'onia' });

    return {};
  });

  const wrapper = LambdaWrapper.promise(handler).event(withText('onia'));

  await wrapper.call({ queryStringParameters: { name: 'onia' } });
});

test('parses the event params', async function (t) {
  const gate = new Gate();

  const handler = gate.handler((event) => {
    t.deepEqual(event.params, { name: 'onia' });

    return {};
  });

  const wrapper = LambdaWrapper.promise(handler).event(withText('onia'));

  await wrapper.call({ pathParameters: { name: 'onia' } });
});

test('parses the event headers', async function (t) {
  const gate = new Gate();

  const handler = gate.handler((event) => {
    t.deepEqual(event.headers, { 'content-type': 'text/plain' });

    return {};
  });

  const wrapper = LambdaWrapper.promise(handler).event(withText('onia'));

  await wrapper.call({ headers: { 'content-type': 'text/plain' } });
});

test('parses the event cookies', async function (t) {
  const gate = new Gate();

  const handler = gate.handler((event) => {
    t.deepEqual(event.cookies, ['123', '456']);

    return {};
  });

  const wrapper = LambdaWrapper.promise(handler).event(withText('onia'));

  await wrapper.call({ cookies: ['123', '456'] });
});

test('parses the event jwt auth', async function (t) {
  const gate = new Gate();

  const handler = gate.handler((event) => {
    t.deepEqual(event.auth.claims, { sub: 1234, iss: 'onia.dev' });
    t.deepEqual(event.auth.scopes, ['admin']);

    t.is(event.auth.context, undefined);

    return {};
  });

  const wrapper = LambdaWrapper.promise(handler).event(withText('onia'));

  await wrapper.call({
    requestContext: {
      authorizer: {
        jwt: {
          claims: { sub: 1234, iss: 'onia.dev' },
          scopes: ['admin'],
        },
      },
    },
  });
});

test('parses the event lambda auth', async function (t) {
  const gate = new Gate();

  const handler = gate.handler((event) => {
    t.deepEqual(event.auth.context, { name: 'onia' });

    t.is(event.auth.claims, undefined);
    t.is(event.auth.scopes, undefined);

    return {};
  });

  const wrapper = LambdaWrapper.promise(handler).event(withText('onia'));

  await wrapper.call({
    requestContext: {
      authorizer: {
        lambda: {
          name: 'onia',
        },
      },
    },
  });
});

test('parses the event form payload', async function (t) {
  const gate = new Gate();

  const handler = gate.handler((event) => {
    t.deepEqual(event.payload, { hello: 'world' });

    return {};
  });

  const wrapper = LambdaWrapper.promise(handler);

  await wrapper.call(withForm('hello=world'));
});

test('parses the event json payload', async function (t) {
  const gate = new Gate();

  const handler = gate.handler((event) => {
    t.deepEqual(event.payload, { hello: 'world' });

    return {};
  });

  const wrapper = LambdaWrapper.promise(handler);

  await wrapper.call(withJson({ hello: 'world' }));
});

test('parses the event text payload', async function (t) {
  const gate = new Gate();

  const handler = gate.handler((event) => {
    t.is(event.payload, 'hello world');

    return {};
  });

  const wrapper = LambdaWrapper.promise(handler);

  await wrapper.call(withText('hello world'));
});

test('parses the event form payload when empty', async function (t) {
  const gate = new Gate();

  const handler = gate.handler((event) => {
    t.deepEqual(event.payload, {});

    return {};
  });

  const wrapper = LambdaWrapper.promise(handler);

  await wrapper.call(withForm(''));
});

test('parses the event json payload when empty', async function (t) {
  const gate = new Gate();

  const handler = gate.handler((event) => {
    t.deepEqual(event.payload, {});

    return {};
  });

  const wrapper = LambdaWrapper.promise(handler);

  await wrapper.call(withJson(''));
});

test('parses the event text payload when empty', async function (t) {
  const gate = new Gate();

  const handler = gate.handler((event) => {
    t.is(event.payload, '');

    return {};
  });

  const wrapper = LambdaWrapper.promise(handler);

  await wrapper.call(withText(''));
});

test('parses the event context', async function (t) {
  const gate = new Gate();

  const handler = gate.handler((event) => {
    t.deepEqual(event.context, { functionName: 'onia' });

    return {};
  });

  const wrapper = LambdaWrapper.promise(handler).event(withText('onia'));

  await wrapper.call({}, { functionName: 'onia' });
});

test('parses the raw event', async function (t) {
  const gate = new Gate();

  const handler = gate.handler((event) => {
    t.deepEqual(event.raw, withText('onia'));

    return {};
  });

  const wrapper = LambdaWrapper.promise(handler);

  await wrapper.call(withText('onia'));
});

test('returns 400 when the payload type is missing', async function (t) {
  const gate = new Gate();

  const handler = gate.handler(() => ({ statusCode: 200 }));

  const wrapper = LambdaWrapper.promise(handler);

  const result = await wrapper.call();

  if (typeof result === 'string') {
    return t.fail();
  }

  const { statusCode, body } = result ?? {};

  t.is(statusCode, 400);

  t.true(body?.includes('Missing content-type header'));
});

test('returns 400 when the payload type is invalid', async function (t) {
  const gate = new Gate();

  const handler = gate.handler(() => ({ statusCode: 200 }));

  const wrapper = LambdaWrapper.promise(handler);

  const result = await wrapper.call({
    headers: {
      'content-type': 'onia',
    },
  });

  if (typeof result === 'string') {
    return t.fail();
  }

  const { statusCode, body } = result ?? {};

  t.is(statusCode, 400);

  t.true(body?.includes('Invalid content-type header'));
});

test('returns 415 when the payload type is not supported', async function (t) {
  const gate = new Gate();

  const handler = gate.handler(() => ({ statusCode: 200 }));

  const wrapper = LambdaWrapper.promise(handler);

  const result = await wrapper.call({
    headers: {
      'content-type': 'multipart/form-data',
    },
  });

  if (typeof result === 'string') {
    return t.fail();
  }

  const { statusCode, body } = result ?? {};

  t.is(statusCode, 415);

  t.true(body?.includes('Unsupported Media Type'));
});

test('returns 400 when the payload type does not match the content', async function (t) {
  const gate = new Gate();

  const handler = gate.handler(() => ({ statusCode: 200 }));

  const wrapper = LambdaWrapper.promise(handler);

  const result = await wrapper.call({
    body: 'onia',
    headers: {
      'content-type': 'application/json',
    },
  });

  if (typeof result === 'string') {
    return t.fail();
  }

  const { statusCode, body } = result ?? {};

  t.is(statusCode, 400);

  t.true(body?.includes('Invalid request body'));
});

test(
  'returns 200 when the user scopes are valid',
  scopes,
  ['+a', '!b', 'c', 'd'],
  ['a', 'd'],
  200
);

test(
  'returns 403 when the user scopes are invalid',
  scopes,
  ['+a', '!b', 'c', 'd'],
  ['a', 'b', 'c'],
  403
);

test(
  'returns 200 when the route scopes are empty',
  scopes,
  [],
  ['a', 'b', 'c'],
  200
);

test(
  'returns 200 when the route scopes are undefined',
  scopes,
  undefined,
  ['a', 'b', 'c'],
  200
);

test(
  'returns 403 when a required scope is missing',
  scopes,
  ['+a', '+b'],
  ['a'],
  403
);

test(
  'returns 200 when all required scopes are present',
  scopes,
  ['+a', '+b'],
  ['a', 'b'],
  200
);

test(
  'returns 403 when a forbidden scope is present',
  scopes,
  ['!a'],
  ['a', 'b'],
  403
);

test(
  'returns 200 when all forbidden scopes are missing',
  scopes,
  ['!a', '!b'],
  ['c'],
  200
);

test(
  'returns 200 when at least one selection scope is present',
  scopes,
  ['a', 'b'],
  ['a'],
  200
);

test(
  'returns 403 when all selection scopes are missing',
  scopes,
  ['a', 'b'],
  ['c'],
  403
);

test('returns 200 when the event is valid', async function (t) {
  interface Payload {
    name: string;
  }

  const gate = new Gate<Payload>({
    validate: {
      payload: Joi.object({
        name: Joi.string().min(3).required(),
      }),
    },
  });

  const handler = gate.handler((event) => {
    t.is(event.payload.name, 'onia');

    return { statusCode: 200 };
  });

  const wrapper = LambdaWrapper.promise(handler);

  const result = await wrapper.call(withJson({ name: 'onia' }));

  if (typeof result === 'string') {
    return t.fail();
  }

  const { statusCode } = result ?? {};

  t.is(statusCode, 200);
});

test('returns 400 when the event is invalid', async function (t) {
  interface Payload {
    name: string;
  }

  const gate = new Gate<Payload>({
    validate: {
      payload: Joi.object({
        name: Joi.string().min(3).required(),
      }),
    },
  });

  const handler = gate.handler(() => {
    t.fail();

    return { statusCode: 200 };
  });

  const wrapper = LambdaWrapper.promise(handler);

  const result = await wrapper.call(withJson({ name: 'x' }));

  if (typeof result === 'string') {
    return t.fail();
  }

  const { statusCode } = result ?? {};

  t.is(statusCode, 400);
});

test('assigns a default value if the event value is undefined', async function (t) {
  interface Payload {
    name: string;
  }

  const gate = new Gate<Payload>({
    validate: {
      payload: Joi.object({
        name: Joi.string().default('onia'),
      }),
    },
  });

  const handler = gate.handler((event) => {
    t.is(event.payload.name, 'onia');

    return { statusCode: 200 };
  });

  const wrapper = LambdaWrapper.promise(handler);

  const result = await wrapper.call(withJson({ name: undefined }));

  if (typeof result === 'string') {
    return t.fail();
  }

  const { statusCode } = result ?? {};

  t.is(statusCode, 200);
});

test('formats the result from a string', async function (t) {
  const gate = new Gate();

  const handler = gate.handler(() => 'onia');

  const wrapper = LambdaWrapper.promise(handler).event(withText('onia'));

  const result = await wrapper.call();

  if (typeof result === 'object') {
    return t.fail();
  }

  t.is(result, 'onia');
});

test('formats the result from a toolkit', async function (t) {
  const gate = new Gate();

  const handler = gate.handler((_, toolkit) => toolkit.code(200).body('onia'));

  const wrapper = LambdaWrapper.promise(handler).event(withText('onia'));

  const result = await wrapper.call();

  if (typeof result === 'string') {
    return t.fail();
  }

  const { statusCode, body } = result ?? {};

  t.is(statusCode, 200);

  t.is(body, 'onia');
});

test('formats the result from a structured object', async function (t) {
  const gate = new Gate();

  const handler = gate.handler(() => ({ statusCode: 200, body: 'onia' }));

  const wrapper = LambdaWrapper.promise(handler).event(withText('onia'));

  const result = await wrapper.call();

  if (typeof result === 'string') {
    return t.fail();
  }

  const { statusCode, body } = result ?? {};

  t.is(statusCode, 200);

  t.is(body, 'onia');
});

test('formats the result from a boom error', async function (t) {
  const gate = new Gate();

  const handler = gate.handler(() => {
    throw Boom.forbidden('Custom message');
  });

  const wrapper = LambdaWrapper.promise(handler).event(withText('onia'));

  const result = await wrapper.call();

  if (typeof result === 'string') {
    return t.fail();
  }

  const { statusCode, body } = result ?? {};

  t.is(statusCode, 403);

  t.true(body?.includes('Custom message'));
});

test('formats the result from a basic error', async function (t) {
  const gate = new Gate();

  const handler = gate.handler(() => {
    throw new Error('Custom message');
  });

  const wrapper = LambdaWrapper.promise(handler).event(withText('onia'));

  const result = await wrapper.call();

  if (typeof result === 'string') {
    return t.fail();
  }

  const { statusCode, body } = result ?? {};

  t.is(statusCode, 500);

  t.true(body?.includes('An internal server error occurred'));
  t.false(body?.includes('Custom message'));
});

test('formats the result from a string error', async function (t) {
  const gate = new Gate();

  const handler = gate.handler(() => {
    throw 'Custom message';
  });

  const wrapper = LambdaWrapper.promise(handler).event(withText('onia'));

  const result = await wrapper.call();

  if (typeof result === 'string') {
    return t.fail();
  }

  const { statusCode, body } = result ?? {};

  t.is(statusCode, 500);

  t.true(body?.includes('An internal server error occurred'));
  t.false(body?.includes('Custom message'));
});
