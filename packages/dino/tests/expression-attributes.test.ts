import test from 'ava';

import { AttributePath, AttributeValue, ExpressionAttributes } from '../src';

const RESERVED_KEYWORDS = ['ADD', 'ALTER', 'IGNORE', 'QUERY', 'SQL'];

test('exposes all names', function (t) {
  const attributes = new ExpressionAttributes();

  attributes.addName('onia.dino');
  attributes.addName(new AttributePath('spri[0].name'));

  t.deepEqual(attributes.names, {
    '#name0': 'onia',
    '#name1': 'dino',
    '#name2': 'spri',
    '#name3': 'name',
  });
});

test('exposes all values', function (t) {
  const attributes = new ExpressionAttributes();

  attributes.addValue('onia');
  attributes.addValue(() => 'dino');
  attributes.addValue(new AttributeValue('spri'));
  attributes.addValue(new AttributeValue({ S: 'name' }, true));

  t.deepEqual(attributes.values, {
    ':value0': { S: 'onia' },
    ':value1': { S: 'dino' },
    ':value2': { S: 'spri' },
    ':value3': { S: 'name' },
  });
});

test('provides expression-safe aliases for names', function (t) {
  const attributes = new ExpressionAttributes();

  for (const keyword of RESERVED_KEYWORDS) {
    const name = attributes.addName(keyword);

    t.not(name, keyword);
    t.regex(name, /^#[\dA-Za-z]+$/);
  }
});

test('provides expression-safe aliases for values', function (t) {
  const attributes = new ExpressionAttributes();

  for (const keyword of RESERVED_KEYWORDS) {
    const value = attributes.addValue(keyword);

    t.not(value, keyword);
    t.regex(value, /^:[\dA-Za-z]+$/);
  }
});

test('returns the same alias for a name used multiple times', function (t) {
  const attributes = new ExpressionAttributes();

  for (const keyword of RESERVED_KEYWORDS) {
    const name = attributes.addName(keyword);

    for (let index = 0; index < 10; index++) {
      t.is(name, attributes.addName(keyword));
    }
  }
});
