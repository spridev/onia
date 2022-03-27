import test from 'ava';

import {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
  Callback,
  Context,
  PreSignUpTriggerEvent,
} from 'aws-lambda';

import { GatewayWrapper } from '../src';

test('wraps a promise handler', async function (t) {
  async function handler(
    event: APIGatewayProxyEventV2
  ): Promise<APIGatewayProxyResultV2> {
    t.like(event, {
      headers: {
        'Content-Type': 'text/plain',
      },
    });

    return { body: 'onia' };
  }

  const wrapper = GatewayWrapper.promise(handler);

  const result = await wrapper.call({
    headers: {
      'Content-Type': 'text/plain',
    },
  });

  t.like(result, { body: 'onia' });
});

test('wraps a callback handler', async function (t) {
  async function handler(
    event: PreSignUpTriggerEvent,
    context: Context,
    callback: Callback<object>
  ): Promise<void> {
    t.like(event, {
      request: {
        userAttributes: {
          name: 'onia',
        },
      },
    });

    callback(undefined, { body: 'onia' });
  }

  const wrapper = GatewayWrapper.callback(handler);

  const result = await wrapper.call({
    request: {
      userAttributes: {
        name: 'onia',
      },
    },
  });

  t.like(result, { body: 'onia' });
});

test('catches errors thrown within a promise handler', async function (t) {
  const error = new Error('💩');

  const wrapper = GatewayWrapper.promise(async function () {
    throw error;
  });

  await t.throwsAsync(() => wrapper.call(), { is: error });
});

test('catches errors thrown within a callback handler', async function (t) {
  const error = new Error('💩');

  const wrapper = GatewayWrapper.callback(function (event, context, callback) {
    callback(error);
  });

  await t.throwsAsync(() => wrapper.call(), { is: error });
});

test('accepts a default event', async function (t) {
  async function handler(
    event: APIGatewayProxyEventV2
  ): Promise<APIGatewayProxyResultV2> {
    t.like(event, {
      headers: {
        'Content-Type': 'text/plain',
      },
    });

    return { body: 'onia' };
  }

  const wrapper = new GatewayWrapper(handler).event({
    headers: {
      'Content-Type': 'text/plain',
    },
  });

  const result = await wrapper.call();

  t.like(result, { body: 'onia' });
});

test('accepts a default context', async function (t) {
  async function handler(
    event: APIGatewayProxyEventV2,
    context: Context
  ): Promise<APIGatewayProxyResultV2> {
    t.like(context, { functionName: 'onia' });

    return { body: 'onia' };
  }

  const wrapper = new GatewayWrapper(handler).context({ functionName: 'onia' });

  const result = await wrapper.call();

  t.like(result, { body: 'onia' });
});

test('overrides the default event with a value', async function (t) {
  async function handler(
    event: APIGatewayProxyEventV2
  ): Promise<APIGatewayProxyResultV2> {
    t.like(event, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return { body: 'onia' };
  }

  const wrapper = new GatewayWrapper(handler).event({
    headers: {
      'Content-Type': 'text/plain',
    },
  });

  const result = await wrapper.call({
    headers: {
      'Content-Type': 'application/json',
    },
  });

  t.like(result, { body: 'onia' });
});

test('overrides the default event with undefined', async function (t) {
  async function handler(
    event: APIGatewayProxyEventV2
  ): Promise<APIGatewayProxyResultV2> {
    t.like(event, {
      headers: {
        'Content-Type': undefined,
      },
    });

    return { body: 'onia' };
  }

  const wrapper = new GatewayWrapper(handler).event({
    headers: {
      'Content-Type': 'text/plain',
    },
  });

  const result = await wrapper.call({
    headers: {
      'Content-Type': undefined,
    },
  });

  t.like(result, { body: 'onia' });
});

test('overrides the default context with a value', async function (t) {
  async function handler(
    event: APIGatewayProxyEventV2,
    context: Context
  ): Promise<APIGatewayProxyResultV2> {
    t.like(context, { functionName: 'spri' });

    return { body: 'onia' };
  }

  const wrapper = new GatewayWrapper(handler).context({ functionName: 'onia' });

  const result = await wrapper.call({}, { functionName: 'spri' });

  t.like(result, { body: 'onia' });
});

test('overrides the default context with undefined', async function (t) {
  async function handler(
    event: APIGatewayProxyEventV2,
    context: Context
  ): Promise<APIGatewayProxyResultV2> {
    t.like(context, { functionName: undefined });

    return { body: 'onia' };
  }

  const wrapper = new GatewayWrapper(handler).context({ functionName: 'onia' });

  const result = await wrapper.call({}, { functionName: undefined });

  t.like(result, { body: 'onia' });
});
