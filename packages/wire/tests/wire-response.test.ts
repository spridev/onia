import { gunzipSync, gzipSync } from 'node:zlib';

import test from 'ava';

import { Server } from '@hapi/hapi';

import { Wire } from '../src';

import { makeEvent } from './fixtures/_event';

test('encodes the result body from a string', async function (t) {
  const server = new Server();

  server.route({
    method: 'GET',
    path: '/route',
    handler() {
      return 'onia';
    },
  });

  await server.initialize();

  const wire = new Wire(server);

  const result = await wire.proxy(makeEvent({ rawPath: '/route' }));

  t.is(result.body, 'onia');
  t.is(result.statusCode, 200);
  t.is(result.isBase64Encoded, false);
});

test('encodes the result body from an object', async function (t) {
  const server = new Server();

  server.route({
    method: 'GET',
    path: '/route',
    handler() {
      return { name: 'onia' };
    },
  });

  await server.initialize();

  const wire = new Wire(server);

  const result = await wire.proxy(makeEvent({ rawPath: '/route' }));

  t.like(JSON.parse(result.body), { name: 'onia' });
  t.is(result.statusCode, 200);
  t.is(result.isBase64Encoded, false);
});

test('encodes the result body from a base64 string', async function (t) {
  const server = new Server();

  server.route({
    method: 'GET',
    path: '/route',
    handler(_, h) {
      return h.response(gzipSync('onia')).header('content-encoding', 'gzip');
    },
  });

  await server.initialize();

  const wire = new Wire(server);

  const result = await wire.proxy(makeEvent({ rawPath: '/route' }));

  t.is(gunzipSync(Buffer.from(result.body, 'base64')).toString('utf8'), 'onia');
  t.is(result.statusCode, 200);
  t.is(result.isBase64Encoded, true);
});

test('encodes the result body using chunked encoding', async function (t) {
  const server = new Server();

  server.route({
    method: 'GET',
    path: '/route',
    handler(_, h) {
      return h
        .response('7\r\nOnia\r\n4\r\nWire\r\n4\r\nText\r\n0\r\n\r\n')
        .header('transfer-encoding', 'chunked');
    },
  });

  await server.initialize();

  const wire = new Wire(server);

  const result = await wire.proxy(makeEvent({ rawPath: '/route' }));

  t.is(result.body, 'OniaWireText');
  t.is(result.statusCode, 200);
  t.is(result.isBase64Encoded, false);
});

test('encodes the result headers', async function (t) {
  const server = new Server();

  server.route({
    method: 'GET',
    path: '/route',
    handler(_, h) {
      return h
        .response('onia')
        .header('content-length', '4')
        .header('content-encoding', 'gzip')
        .header('x-count', '1')
        .header('x-count', '2', { append: true });
    },
  });

  await server.initialize();

  const wire = new Wire(server);

  const result = await wire.proxy(makeEvent({ rawPath: '/route' }));

  t.is(result.headers['content-length'], '4');
  t.is(result.headers['content-encoding'], 'gzip');
  t.is(result.headers['x-count'], '1,2');
});
