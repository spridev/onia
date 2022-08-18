import test from 'ava';

import { Server } from '@hapi/hapi';

import { Wire } from '../src';

import { makeEvent } from './fixtures/_event';

test('decodes the event path from a proxy parameter', async function (t) {
  const server = new Server();

  server.route({
    method: 'GET',
    path: '/route',
    handler(event) {
      t.is(event.path, '/route');

      return {};
    },
  });

  await server.initialize();

  const wire = new Wire(server);

  await wire.proxy(
    makeEvent({
      pathParameters: {
        proxy: 'route',
      },
    })
  );

  t.plan(1);
});

test('decodes the event path from a raw path', async function (t) {
  const server = new Server();

  server.route({
    method: 'GET',
    path: '/route',
    handler(event) {
      t.is(event.path, '/route');

      return {};
    },
  });

  await server.initialize();

  const wire = new Wire(server);

  await wire.proxy(
    makeEvent({
      rawPath: '/$default/route',
      requestContext: {
        stage: '$default',
      },
    })
  );

  t.plan(1);
});

test('decodes the event path parameters', async function (t) {
  const server = new Server();

  server.route({
    method: 'GET',
    path: '/route/{name}',
    handler(event) {
      t.like(event.params, { name: 'onia' });

      return {};
    },
  });

  await server.initialize();

  const wire = new Wire(server);

  await wire.proxy(
    makeEvent({
      rawPath: '/route/onia',
    })
  );

  t.plan(1);
});

test('decodes the event query parameters', async function (t) {
  const server = new Server();

  server.route({
    method: 'GET',
    path: '/route',
    handler(event) {
      t.like(event.query, { name: 'onia', lang: ['fr', 'en'] });

      return {};
    },
  });

  await server.initialize();

  const wire = new Wire(server);

  await wire.proxy(
    makeEvent({
      rawPath: '/route',
      rawQueryString: 'name=onia&lang=fr&lang=en',
    })
  );

  t.plan(1);
});

test('decodes the event headers', async function (t) {
  const server = new Server();

  server.route({
    method: 'GET',
    path: '/route',
    handler(event) {
      t.like(event.headers, { 'content-type': 'text/plain' });

      return {};
    },
  });

  await server.initialize();

  const wire = new Wire(server);

  await wire.proxy(
    makeEvent({
      rawPath: '/route',
      headers: {
        'content-type': 'text/plain',
        'content-length': undefined,
      },
    })
  );

  t.plan(1);
});

test('decodes the event cookies', async function (t) {
  const server = new Server();

  server.route({
    method: 'GET',
    path: '/route',
    handler(event) {
      t.like(event.state, { name: 'onia', lang: 'en' });

      return {};
    },
  });

  await server.initialize();

  const wire = new Wire(server);

  await wire.proxy(
    makeEvent({
      rawPath: '/route',
      cookies: ['name=onia', 'lang=en'],
    })
  );

  t.plan(1);
});

test('decodes the event payload from base64', async function (t) {
  const server = new Server();

  server.route({
    method: 'POST',
    path: '/route',
    handler(event) {
      t.like(event.payload, { name: 'onia' });

      return {};
    },
  });

  await server.initialize();

  const wire = new Wire(server);

  const body = JSON.stringify({ name: 'onia' });

  await wire.proxy(
    makeEvent({
      rawPath: '/route',
      body: Buffer.from(body, 'utf8').toString('base64'),
      isBase64Encoded: true,
      requestContext: { http: { method: 'POST' } },
    })
  );

  t.plan(1);
});

test('decodes the event payload from utf8', async function (t) {
  const server = new Server();

  server.route({
    method: 'POST',
    path: '/route',
    handler(event) {
      t.like(event.payload, { name: 'onia' });

      return {};
    },
  });

  await server.initialize();

  const wire = new Wire(server);

  const body = JSON.stringify({ name: 'onia' });

  await wire.proxy(
    makeEvent({
      rawPath: '/route',
      body: body,
      isBase64Encoded: false,
      requestContext: { http: { method: 'POST' } },
    })
  );

  t.plan(1);
});

test('decodes the event auth from a jwt authorizer', async function (t) {
  const server = new Server();

  server.route({
    method: 'GET',
    path: '/route',
    handler(event) {
      const { strategy, credentials } = event.auth;

      t.is(strategy, 'jwt');

      t.is(credentials.sub, 1234);
      t.deepEqual(credentials.scope, ['admin', 'guest']);

      return {};
    },
  });

  await server.initialize();

  const wire = new Wire(server);

  await wire.proxy(
    makeEvent({
      rawPath: '/route',
      requestContext: {
        authorizer: {
          jwt: {
            claims: { sub: 1234 },
            scopes: ['admin', 'guest'],
          },
        },
      },
    })
  );

  t.plan(3);
});

test('decodes the event auth from a lambda authorizer', async function (t) {
  const server = new Server();

  server.route({
    method: 'GET',
    path: '/route',
    handler(event) {
      const { strategy, artifacts, credentials } = event.auth;

      t.is(strategy, 'lambda');

      t.is(artifacts.sub, 1234);
      t.is(credentials.sub, 1234);

      return {};
    },
  });

  await server.initialize();

  const wire = new Wire(server);

  await wire.proxy(
    makeEvent({
      rawPath: '/route',
      requestContext: {
        authorizer: {
          lambda: {
            sub: 1234,
          },
        },
      },
    })
  );

  t.plan(3);
});
