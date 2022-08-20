import * as Path from 'node:path';

import { Resource } from '../resource';

export class FunctionResource extends Resource {
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
    return this.rootOutput;
  }
}
