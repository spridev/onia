import * as Fs from 'node:fs';
import * as Path from 'node:path';

import typescript from '@rollup/plugin-typescript';
import { sync } from 'fast-glob';

import { bang } from './plugins/bang';
import { copy } from './plugins/copy';
import { ugly } from './plugins/ugly';

import type { RollupOptions, RollupWarning, WarningHandler } from 'rollup';

export interface BundleOptions {
  functions?: string[];
  extensions?: string[];
}

export interface Metadata {
  name: string;
  path: string;
  main: string;
  deps: string[];
}

/**
 * Get the metadata for a package.json file.
 */
function getMetadata(packagePath: string): Metadata {
  const { base, dir } = Path.parse(packagePath);

  if (base !== 'package.json') {
    throw new Error(`Expected package.json in ${packagePath}`);
  }

  const packageJson = JSON.parse(Fs.readFileSync(packagePath, 'utf8'));

  if (!packageJson.name) {
    throw new Error(`Package ${packagePath} has no name`);
  }

  return {
    path: dir.split('/').slice(1).join('/'),
    name: packageJson.name,
    main: packageJson.main ?? 'index.ts',
    deps: packageJson.dependencies ? Object.keys(packageJson.dependencies) : [],
  };
}

/**
 * Throw an error if a dependency is missing.
 */
function onWarning(warning: RollupWarning, handler: WarningHandler): void {
  if (warning.code === 'UNRESOLVED_IMPORT') {
    throw new Error(warning.message);
  }

  handler(warning);
}

/**
 * Bundle a lambda function.
 */
function bundleFunction(packagePath: string): RollupOptions {
  const metadata = getMetadata(packagePath);

  return {
    input: Path.join(metadata.path, metadata.main),
    output: {
      dir: `build/${metadata.name}`,
      format: 'cjs',
      sourcemap: true,
    },
    external: metadata.deps,
    onwarn: onWarning,
    plugins: [
      typescript(),
      ugly(),
      copy([
        {
          from: [`${metadata.path}/package.json`],
          to: 'build',
        },
      ]),
    ],
  };
}

/**
 * Bundle a lambda extension.
 */
function bundleExtension(packagePath: string): RollupOptions {
  const metadata = getMetadata(packagePath);

  return {
    input: Path.join(metadata.path, metadata.main),
    output: {
      dir: `build/${metadata.name}/${metadata.name}`,
      format: 'cjs',
      sourcemap: true,
    },
    external: metadata.deps,
    onwarn: onWarning,
    plugins: [
      typescript(),
      bang(),
      ugly(),
      copy([
        {
          from: [
            `${metadata.path}/package.json`,
            'extensions/Makefile',
            `extensions/extensions/${metadata.name}`,
          ],
          to: `build/${metadata.name}`,
        },
      ]),
    ],
  };
}

/**
 * Bundle all lambda functions and extensions.
 */
export function bundle(options: BundleOptions): RollupOptions[] {
  const output: RollupOptions[] = [];

  if (options.functions) {
    for (const packagePath of options.functions) {
      output.push(bundleFunction(packagePath));
    }
  }

  if (options.extensions) {
    for (const packagePath of options.extensions) {
      output.push(bundleExtension(packagePath));
    }
  }

  return output;
}

/**
 * Get all files matching the given pattern.
 */
export function glob(pattern: string): string[] {
  return sync(pattern);
}
