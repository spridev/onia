import test from 'ava';

import { AttributeValue } from '../src';

test('creates an attribute value from a raw value', function (t) {
  t.like(new AttributeValue('spri'), { element: { S: 'spri' } });
});

test('creates an attribute value from a marshalled value', function (t) {
  t.like(new AttributeValue({ S: 'spri' }, true), { element: { S: 'spri' } });
});
