import * as Path from 'node:path';

import { toPascalCase } from '../helpers';
import { WriteRule } from '../plugins/write';
import { Resource } from '../resource';

const makefileContent = `build-{{name}}:
\tmkdir -p "$(ARTIFACTS_DIR)/nodejs"

\tcp -r {{directory}} "$(ARTIFACTS_DIR)/nodejs"

\tnpm install --production --prefix "$(ARTIFACTS_DIR)/nodejs/{{directory}}"
`;

export class LayerResource extends Resource {
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
          name: `${toPascalCase(this.$package.name)}Layer`,
          directory: this.$package.name,
        },
      },
    ];
  }
}
