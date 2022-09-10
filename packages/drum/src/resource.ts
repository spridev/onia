import * as Path from 'node:path';

import typescript from '@rollup/plugin-typescript';

import { PackageMetadata, getPackageMetadata } from './package';
import { clean } from './plugins/clean';
import { CopyRule, copy } from './plugins/copy';
import { imports } from './plugins/imports';
import { shebang } from './plugins/shebang';
import { terser } from './plugins/terser';
import { WriteRule, write } from './plugins/write';

import type {
  ModuleFormat,
  RollupOptions,
  RollupWarning,
  WarningHandler,
} from 'rollup';

export type ResourceType = 'extension' | 'function' | 'layer';

export interface ResourceOptions {
  type: ResourceType;
  input: string;
  output: string;
  entry?: string;
  include?: CopyRule[];
}

export abstract class Resource {
  /**
   * The resource options.
   */
  protected readonly $options: ResourceOptions;

  /**
   * The package metadata.
   */
  protected readonly $package: PackageMetadata;

  /**
   * Create a new resource.
   */
  constructor(options: ResourceOptions) {
    this.$options = options;
    this.$package = getPackageMetadata(options.input);
  }

  /**
   * Get the root input directory.
   */
  get rootInput(): string {
    return this.$package.path;
  }

  /**
   * Get the root output directory.
   */
  abstract get rootOutput(): string;

  /**
   * Get the code input directory.
   */
  abstract get codeInput(): string;

  /**
   * Get the code output directory.
   */
  abstract get codeOutput(): string;

  /**
   * Get the code format.
   */
  get codeFormat(): ModuleFormat {
    return 'cjs';
  }

  /**
   * Get the external dependencies.
   */
  get dependencies(): (string | RegExp)[] {
    return [...this.$package.dependencies, /^node:/];
  }

  /**
   * Get the files to copy.
   */
  get copyRules(): CopyRule[] {
    const rules: CopyRule[] = [
      {
        from: Path.join(this.rootInput, 'package.json'),
        to: this.codeOutput,
        required: true,
      },
    ];

    if (this.$options.include) {
      rules.push(
        ...this.$options.include.map(({ from, to, ...options }) => ({
          from: Path.join(Path.dirname(this.codeInput), from),
          to: Path.join(this.codeOutput, to),
          ...options,
        }))
      );
    }

    return rules;
  }

  /**
   * Get the files to write.
   */
  get writeRules(): WriteRule[] {
    return [];
  }

  /**
   * Handle bundling warnings.
   */
  private onWarning(warning: RollupWarning, handler: WarningHandler): void {
    if (warning.code === 'UNRESOLVED_IMPORT') {
      throw new Error(warning.message);
    }

    handler(warning);
  }

  /**
   * Bundle the resource.
   */
  bundle(): RollupOptions {
    return {
      input: this.codeInput,
      external: this.dependencies,
      onwarn: this.onWarning,
      output: {
        dir: this.codeOutput,
        format: this.codeFormat,
        sourcemap: true,
      },
      plugins: [
        clean(this.rootOutput),
        typescript(),
        imports(),
        shebang(),
        terser(),
        copy(this.copyRules),
        write(this.writeRules),
      ],
    };
  }
}
