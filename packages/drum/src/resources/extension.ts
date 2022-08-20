import * as Path from 'node:path';

import { toPascalCase } from '../helpers';
import { WriteRule } from '../plugins/write';
import { Resource } from '../resource';

const makefileContent = `build-{{name}}:
\tcp -r extensions "$(ARTIFACTS_DIR)"
\tcp -r {{directory}} "$(ARTIFACTS_DIR)"

\tnpm install --production --prefix "$(ARTIFACTS_DIR)/{{directory}}"
`;

const executeContent = `#!/bin/bash

set -euo pipefail

exec "/opt/{{directory}}/index.js"
`;

export class ExtensionResource extends Resource {
  /**
   * Get the root output directory.
   */
  get rootOutput(): string {
    return this.$options.output;
  }

  /**
   * Get the code input directory.
   */
  get codeInput(): string {
    return Path.join(this.rootInput, this.$options.entry ?? 'lib/index.ts');
  }

  /**
   * Get the code output directory.
   */
  get codeOutput(): string {
    return Path.join(this.rootOutput, this.$package.name);
  }

  /**
   * Get the files to write.
   */
  get writeRules(): WriteRule[] {
    return [
      {
        to: Path.join(this.rootOutput, 'Makefile'),
        content: makefileContent,
        context: {
          name: `${toPascalCase(this.$package.name)}Extension`,
          directory: this.$package.name,
        },
      },
      {
        to: Path.join(this.rootOutput, `extensions/${this.$package.name}`),
        content: executeContent,
        context: {
          directory: this.$package.name,
        },
      },
    ];
  }
}
