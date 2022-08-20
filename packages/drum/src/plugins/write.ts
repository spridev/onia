import * as Fs from 'node:fs/promises';
import * as Path from 'node:path';

import type { Plugin } from 'rollup';

export interface WriteRule {
  to: string;
  content: string;
  context: Record<string, string>;
}

/**
 * Write files with the given content to the output directory.
 */
export function write(rules: WriteRule[]): Plugin {
  return {
    name: 'write',
    async buildEnd(): Promise<void> {
      for (const rule of rules) {
        let content = rule.content;

        for (const [key, value] of Object.entries(rule.context)) {
          content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
        }

        const directory = Path.dirname(rule.to);

        await Fs.mkdir(directory, { recursive: true });
        await Fs.writeFile(rule.to, content);
      }
    },
  };
}
