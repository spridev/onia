import test from 'ava';

import { AttributeValue } from '../src';

test('creates an attribute value from a raw value', function (t) {
  t.like(new AttributeValue('spri'), { element: { S: 'spri' } });
});
