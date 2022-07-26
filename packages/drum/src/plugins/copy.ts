import * as Fs from 'node:fs';
import * as Path from 'node:path';

import { bold, gray } from 'colorette';
import { sync } from 'fast-glob';

import type { Plugin } from 'rollup';

export interface CopyRule {
  readonly from: string[];
  readonly to: string;
}

/**
 * Plugin to copy files from the source directory to the output directory.
 */
export function copy(rules: CopyRule[]): Plugin {
  return {
    name: 'copy',
    buildEnd(): void {
      for (const { from, to } of rules) {
        const sources = sync(from);

        for (const source of sources) {
          const { base, dir } = Path.parse(source);

          const destination = Path.join(
            !dir ? to : dir.replace(dir.split('/')[0], to),
            base
          );

          Fs.cpSync(source, destination);

          console.log(gray(`${bold(source)} → ${bold(destination)}`));
        }
      }
    },
  };
}
