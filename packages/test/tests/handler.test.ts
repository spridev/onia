import test from 'ava';

import {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
  Callback,
  Context,
  PreSignUpTriggerEvent,
} from 'aws-lambda';

import { wrapCallbackHandler, wrapPromiseHandler } from '../src';

test('wraps a lambda promise handler', async function (t) {
  async function handler(
    event: APIGatewayProxyEventV2,
    context: Context
  ): Promise<APIGatewayProxyResultV2> {
    t.like(event, {
      headers: {
        'content-type': 'application/json',
      },
    });

    t.truthy(context.functionName);

    return { body: 'onia' };
  }

  const wrapper = wrapPromiseHandler(handler);

  const result = await wrapper({
    headers: {
      'content-type': 'application/json',
    },
  });

  t.like(result, { body: 'onia' });
});

test('wraps a lambda promise handler with custom context', async function (t) {
  async function handler(
    event: APIGatewayProxyEventV2,
    context: Context
  ): Promise<APIGatewayProxyResultV2> {
    t.like(context, { functionName: 'onia' });

    return { body: 'onia' };
  }

  const wrapper = wrapPromiseHandler(handler);

  const result = await wrapper({}, { functionName: 'onia' });

  t.like(result, { body: 'onia' });
});

test('catches errors thrown within a lambda promise handler', async function (t) {
  const error = new Error('💩');

  const wrapper = wrapPromiseHandler(async function () {
    throw error;
  });

  await t.throwsAsync(() => wrapper({}), { is: error });
});

test('wraps a lambda callback handler', async function (t) {
  async function handler(
    event: PreSignUpTriggerEvent,
    context: Context,
    callback: Callback<object>
  ): Promise<void> {
    t.like(event, {
      response: {
        autoConfirmUser: true,
      },
    });

    t.truthy(context.functionName);

    callback(undefined, { body: 'onia' });
  }

  const wrapper = wrapCallbackHandler(handler);

  const result = await wrapper({
    response: {
      autoConfirmUser: true,
    },
  });

  t.like(result, { body: 'onia' });
});

test('wraps a lambda callback handler with custom context', async function (t) {
  async function handler(
    event: PreSignUpTriggerEvent,
    context: Context,
    callback: Callback<object>
  ): Promise<void> {
    t.like(context, { functionName: 'onia' });

    callback(undefined, { body: 'onia' });
  }

  const wrapper = wrapCallbackHandler(handler);

  const result = await wrapper({}, { functionName: 'onia' });

  t.like(result, { body: 'onia' });
});

test('catches errors thrown within a lambda callback handler', async function (t) {
  const error = new Error('💩');

  const wrapper = wrapCallbackHandler(function (event, context, callback) {
    callback(error);
  });

  await t.throwsAsync(() => wrapper({}), { is: error });
});
