import test from 'ava';

import { Server } from '@hapi/hapi';

import { Wire } from '../src';

import { makeEvent } from './fixtures/_event';

async function createServer(): Promise<Server> {
  const server = new Server();

  server.route({
    method: 'GET',
    path: '/route',
    handler: () => 'onia',
  });

  await server.initialize();

  return server;
}

test('creates a wire from a single route', async function (t) {
  const wire = Wire.single({
    handler(event) {
      t.like(event.params, { names: 'spri/onia' });

      return 'onia';
    },
  });

  const result = await wire.proxy(
    makeEvent({
      routeKey: 'GET /users/{names+}',
      rawPath: '/$default/users/spri/onia',
      requestContext: {
        stage: '$default',
      },
      pathParameters: {
        names: 'spri/onia',
      },
    })
  );

  t.is(result.body, 'onia');

  t.plan(2);
});

test('creates a wire from a server instance', async function (t) {
  const server = await createServer();

  const wire = new Wire(server);

  const result = await wire.proxy(
    makeEvent({
      pathParameters: {
        proxy: 'route',
      },
    })
  );

  t.is(result.body, 'onia');
});

test('creates a wire from a builder function', async function (t) {
  const wire = new Wire(() => createServer());

  const result = await wire.proxy(
    makeEvent({
      pathParameters: {
        proxy: 'route',
      },
    })
  );

  t.is(result.body, 'onia');
});

test('caches the server instance in memory', async function (t) {
  const server = new Server();

  const wire = new Wire(server);

  const event = makeEvent({
    pathParameters: {
      proxy: 'route',
    },
  });

  t.is(wire['$server'], undefined);

  await wire.proxy(event);

  t.is(wire['$server'], server);

  await wire.proxy(event);

  t.is(wire['$server'], server);
});
