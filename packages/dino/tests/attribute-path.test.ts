import test from 'ava';

import { AttributePath } from '../src';

test('creates an attribute path from a string', function (t) {
  t.like(new AttributePath('onia.dino.spri[3][4][2].dino[0].onia[1]'), {
    elements: [
      { name: 'onia' },
      { name: 'dino' },
      { name: 'spri' },
      { index: 3 },
      { index: 4 },
      { index: 2 },
      { name: 'dino' },
      { index: 0 },
      { name: 'onia' },
      { index: 1 },
    ],
  });
});

test('allows embedded control characters', function (t) {
  t.like(new AttributePath('onia\\[1]dino\\.\\\\spri.dino'), {
    elements: [{ name: 'onia[1]dino.\\spri' }, { name: 'dino' }],
  });
});

test('throws when a path begins with a control character', function (t) {
  t.throws(() => new AttributePath('[1]'), {
    message: /Invalid control character/,
  });
});

test('throws when a list index access contains no characters', function (t) {
  t.throws(() => new AttributePath('onia[]'), {
    message: /Invalid array index/,
  });
});

test('throws when a list index access contains invalid characters', function (t) {
  t.throws(() => new AttributePath('onia[x]'), {
    message: /Invalid array index character/,
  });
});

test('throws when an identifier immediately follows a list index access', function (t) {
  t.throws(() => new AttributePath('onia[1]dino'), {
    message: /Bare identifier encountered/,
  });
});
