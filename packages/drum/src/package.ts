import * as Fs from 'node:fs';
import * as Path from 'node:path';

export interface PackageMetadata {
  name: string;
  path: string;
  dependencies: string[];
}

/**
 * Get the metadata for a package file.
 */
export function getPackageMetadata(packagePath: string): PackageMetadata {
  if (!Fs.existsSync(packagePath)) {
    throw new Error(`Path ${packagePath} does not exist`);
  }

  if (!Fs.statSync(packagePath).isFile()) {
    packagePath = Path.join(packagePath, 'package.json');
  }

  const { base, dir: path } = Path.parse(packagePath);

  if (base !== 'package.json') {
    throw new Error(`Path ${packagePath} is not a package.json file`);
  }

  const packageJson = JSON.parse(Fs.readFileSync(packagePath, 'utf8'));

  if (!packageJson.name) {
    throw new Error(`Package ${packagePath} has no 'name' field`);
  }

  return {
    name: packageJson.name,
    path: path,
    dependencies: packageJson.dependencies
      ? Object.keys(packageJson.dependencies)
      : [],
  };
}
