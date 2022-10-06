import { ResourceOptions } from './resource';
import { ExtensionResource } from './resources/extension';
import { FunctionResource } from './resources/function';
import { LayerResource } from './resources/layer';

import type { RollupOptions } from 'rollup';

export interface BundleOptions {
  resources: ResourceOptions[];
}

/**
 * Bundle lambda extensions, functions and layers.
 */
export function bundle(options: BundleOptions): RollupOptions[] {
  return options.resources.map((resource) => {
    switch (resource.type) {
      case 'extension': {
        return new ExtensionResource(resource).bundle();
      }
      case 'function': {
        return new FunctionResource(resource).bundle();
      }
      case 'layer': {
        return new LayerResource(resource).bundle();
      }
    }
  });
}
