import * as Fs from 'node:fs';

import { bold, red } from 'colorette';

import type { Plugin } from 'rollup';

/**
 * Clean the output directory.
 */
export function clean(paths: string[]): Plugin {
  return {
    name: 'clean',
    async buildStart(): Promise<void> {
      for (const path of paths) {
        if (Fs.existsSync(path)) {
          Fs.rmSync(path, { recursive: true });
        }
      }

      console.log(red(`deleted ${bold(paths.join(', '))}`));
    },
  };
}
