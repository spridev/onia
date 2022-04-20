import test from 'ava';

import { GateToolkit } from '../src';

test('sets the result body to an empty string by default', function (t) {
  const toolkit = new GateToolkit();

  t.like(toolkit.build(), { body: '' });
});

test('sets the result body from string', function (t) {
  const toolkit = new GateToolkit();

  toolkit.body('onia');

  t.like(toolkit.build(), { body: 'onia' });
});

test('sets the result body from object', function (t) {
  const toolkit = new GateToolkit();

  toolkit.body({ name: 'onia' });

  t.like(toolkit.build(), { body: '{"name":"onia"}' });
});

test('sets the result code to 200 by default', function (t) {
  const toolkit = new GateToolkit();

  t.like(toolkit.build(), { statusCode: 200 });
});

test('sets the result code', function (t) {
  const toolkit = new GateToolkit();

  toolkit.code(205);

  t.like(toolkit.build(), { statusCode: 205 });
});

test('sets the given header value', function (t) {
  const toolkit = new GateToolkit();

  toolkit.header('name', 'onia');
  toolkit.header('code', '1234');

  t.like(toolkit.build(), {
    headers: {
      name: 'onia',
      code: '1234',
    },
  });
});

test('appends the given header value', function (t) {
  const toolkit = new GateToolkit();

  toolkit.header('name', 'onia', true);

  toolkit.header('code', '1234');
  toolkit.header('code', '5678', true);
  toolkit.header('code', '0000', true);

  t.like(toolkit.build(), {
    headers: {
      name: 'onia',
      code: '1234,5678,0000',
    },
  });
});

test('overrides the given header value', function (t) {
  const toolkit = new GateToolkit();

  toolkit.header('code', '1234');
  toolkit.header('code', '5678');

  t.like(toolkit.build(), {
    headers: {
      code: '5678',
    },
  });
});

test('converts the header keys to lowercase', function (t) {
  const toolkit = new GateToolkit();

  toolkit.header('NAME', 'ONIA');

  t.like(toolkit.build(), {
    headers: {
      name: 'ONIA',
    },
  });
});

test('sets the content-type header', function (t) {
  const toolkit = new GateToolkit();

  toolkit.type('application/json');

  t.like(toolkit.build(), {
    headers: {
      'content-type': 'application/json',
    },
  });
});

test('sets the content-length header', function (t) {
  const toolkit = new GateToolkit();

  toolkit.bytes(256);

  t.like(toolkit.build(), {
    headers: {
      'content-length': '256',
    },
  });
});

test('sets the location header', function (t) {
  const toolkit = new GateToolkit();

  toolkit.location('/index');

  t.like(toolkit.build(), {
    headers: {
      location: '/index',
    },
  });
});

test('returns a 201 result', function (t) {
  const toolkit = new GateToolkit();

  toolkit.created('/index');

  t.like(toolkit.build(), {
    statusCode: 201,
    headers: {
      location: '/index',
    },
  });
});

test('returns a 204 result', function (t) {
  const toolkit = new GateToolkit();

  toolkit.empty();

  t.like(toolkit.build(), {
    statusCode: 204,
    body: '',
  });
});

test('returns a 302 result', function (t) {
  const toolkit = new GateToolkit();

  toolkit.redirect('/index');

  t.like(toolkit.build(), {
    statusCode: 302,
    headers: {
      location: '/index',
    },
  });
});
