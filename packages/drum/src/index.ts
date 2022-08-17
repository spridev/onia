import * as Fs from 'node:fs';
import * as Path from 'node:path';

import types from '@rollup/plugin-typescript';

import { bang } from './plugins/bang';
import { clean } from './plugins/clean';
import { copy, CopyRule } from './plugins/copy';
import { ugly } from './plugins/ugly';

import type { RollupOptions, RollupWarning, WarningHandler } from 'rollup';

export type PackageType = 'extension' | 'function' | 'layer';

export interface PackageOptions {
  type: PackageType;
  path: string;
  copy?: CopyRule[];
}

export interface PackageMetadata {
  name: string;
  location: string;
  entrypoint: string;
  dependencies: string[];
}

export interface BundleOptions {
  output: string;
  packages: PackageOptions[];
}

/**
 * Get the metadata for a package file.
 */
function getPackageMetadata(packagePath: string): PackageMetadata {
  if (!Fs.existsSync(packagePath)) {
    throw new Error(`Path ${packagePath} does not exist`);
  }

  if (!Fs.statSync(packagePath).isFile()) {
    packagePath = Path.join(packagePath, 'package.json');
  }

  const { base, dir } = Path.parse(packagePath);

  if (base !== 'package.json') {
    throw new Error(`Path ${packagePath} is not a package.json file`);
  }

  const packageJson = JSON.parse(Fs.readFileSync(packagePath, 'utf8'));

  if (!packageJson.name) {
    throw new Error(`Package ${packagePath} has no 'name' field`);
  }

  if (!packageJson.main) {
    throw new Error(`Package ${packagePath} has no 'main' field`);
  }

  return {
    name: packageJson.name,
    location: dir,
    entrypoint: packageJson.main,
    dependencies: packageJson.dependencies
      ? Object.keys(packageJson.dependencies)
      : [],
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
 * Bundle lambda extensions, functions and layers.
 */
export function bundle(bundleOptions: BundleOptions): RollupOptions[] {
  const rollupOptions: RollupOptions[] = [];

  for (const packageOptions of bundleOptions.packages) {
    const packageMetadata = getPackageMetadata(packageOptions.path);

    const packageDestination = Path.join(
      bundleOptions.output,
      packageMetadata.name
    );

    const codeEntrypoint = Path.join(
      packageMetadata.location,
      packageMetadata.entrypoint
    );

    const codeDestination =
      packageOptions.type === 'extension'
        ? Path.join(packageDestination, packageMetadata.name)
        : packageDestination;

    const codeFormat = 'cjs';

    const copyRules: CopyRule[] = [
      {
        from: Path.join(packageMetadata.location, 'package.json'),
        to: codeDestination,
        required: true,
      },
      {
        from: Path.join(packageMetadata.location, 'Makefile'),
        to: packageDestination,
        required: packageOptions.type === 'extension',
      },
    ];

    if (packageOptions.type === 'extension') {
      copyRules.push({
        from: Path.join(packageMetadata.location, 'exec'),
        to: Path.join(packageDestination, 'extensions'),
        rename: packageMetadata.name,
        required: true,
      });
    }

    if (packageOptions.copy) {
      copyRules.push(
        ...packageOptions.copy.map(({ from, to, ...options }) => ({
          from: Path.join(packageMetadata.location, from),
          to: Path.join(packageDestination, to),
          ...options,
        }))
      );
    }

    rollupOptions.push({
      input: codeEntrypoint,
      onwarn: onWarning,
      external: packageMetadata.dependencies,
      output: {
        dir: codeDestination,
        format: codeFormat,
        sourcemap: true,
      },
      plugins: [
        clean(packageDestination),
        types(),
        bang(),
        ugly(),
        copy(copyRules),
      ],
    });
  }

  return rollupOptions;
}
