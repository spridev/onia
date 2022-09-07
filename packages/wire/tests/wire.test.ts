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
