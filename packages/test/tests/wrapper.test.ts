import test from 'ava';

import {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
  Callback,
  Context,
  PreSignUpTriggerEvent,
} from 'aws-lambda';

import { Wrapper } from '../src';

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

  const wrapper = Wrapper.fromPromise(handler);

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

  const wrapper = Wrapper.fromCallback(handler);

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

  const wrapper = Wrapper.fromPromise(async function () {
    throw error;
  });

  await t.throwsAsync(() => wrapper.call(), { is: error });
});

test('catches errors thrown within a callback handler', async function (t) {
  const error = new Error('💩');

  const wrapper = Wrapper.fromCallback(function (event, context, callback) {
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

  const wrapper = new Wrapper(handler).event({
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
    t.like(context, {
      functionName: 'onia',
    });

    return { body: 'onia' };
  }

  const wrapper = new Wrapper(handler).context({
    functionName: 'onia',
  });

  const result = await wrapper.call();

  t.like(result, { body: 'onia' });
});

test('overrides the default event', async function (t) {
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

  const wrapper = new Wrapper(handler).event({
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

test('overrides the default context', async function (t) {
  async function handler(
    event: APIGatewayProxyEventV2,
    context: Context
  ): Promise<APIGatewayProxyResultV2> {
    t.like(context, {
      functionName: 'spri',
    });

    return { body: 'onia' };
  }

  const wrapper = new Wrapper(handler).context({
    functionName: 'onia',
  });

  const result = await wrapper.call(
    {},
    {
      functionName: 'spri',
    }
  );

  t.like(result, { body: 'onia' });
});
