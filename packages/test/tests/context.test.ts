import test from 'ava';

import { Context } from 'aws-lambda';

import { createContext } from '../src';

test('creates a lambda context', function (t) {
  const context: Context = createContext();

  t.truthy(context);
});

test('creates a lambda context with custom parameters', function (t) {
  const context: Context = createContext({
    functionName: 'onia',
  });

  t.like(context, { functionName: 'onia' });
});
