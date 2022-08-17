import * as Fs from 'node:fs';
import * as Path from 'node:path';

import { bold, gray } from 'colorette';
import { sync } from 'fast-glob';

import type { Plugin } from 'rollup';

export interface CopyRule {
  to: string;
  from: string;
  rename?: string;
  required?: boolean;
}

/**
 * Plugin to copy files from the source directory to the output directory.
 */
export function copy(rules: CopyRule[]): Plugin {
  return {
    name: 'copy',
    buildEnd(): void {
      for (const rule of rules) {
        const sources = sync(rule.from.replace(/\\/g, '/'));

        if (rule.required && sources.length === 0) {
          throw new Error(`No files found matching ${rule.from}`);
        }

        for (const source of sources) {
          const { base } = Path.parse(source);

          const destination = Path.join(rule.to, rule.rename ?? base);

          Fs.cpSync(source, destination);

          console.log(gray(`${bold(source)} → ${bold(destination)}`));
        }
      }
    },
  };
}
