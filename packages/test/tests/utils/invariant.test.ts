import test from 'ava';

import { invariant } from '../../src/utils/invariant';

test('accepts a truthy condition', function (t) {
  const values = [1, -1, true, {}, [], Symbol(), 'x'];

  for (const value of values) {
    t.notThrows(() => invariant(value));
  }
});

test('rejects a falsy condition', function (t) {
  const values = [+0, -0, false, undefined, Number.NaN, ''];

  for (const value of values) {
    t.throws(() => invariant(value));
  }
});

test('outputs a default error message', function (t) {
  t.throws(() => invariant(false), { message: 'Invariant failed' });
});

test('outputs a custom error message', function (t) {
  t.throws(() => invariant(false, '💩'), { message: '💩' });
});
