/* eslint-disable unicorn/no-null */

import type { Plugin } from 'rollup';

/**
 * Preserve /opt/* imports.
 */
export function layer(): Plugin {
  return {
    name: 'opt',
    resolveId: {
      order: 'pre',
      handler(source) {
        if (source.startsWith('/opt/')) {
          return { id: source, external: 'absolute' };
        }

        return null;
      },
    },
  };
}
