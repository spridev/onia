import { minify } from 'terser';

import type {
  SourceMapInput,
  Plugin,
  NormalizedOutputOptions,
  RenderedChunk,
} from 'rollup';

interface RenderChunkResult {
  code: string;
  map?: SourceMapInput;
}

/**
 * Plugin to minify code.
 */
export function ugly(): Plugin {
  return {
    name: 'ugly',
    async renderChunk(
      code: string,
      chunk: RenderedChunk,
      { sourcemap }: NormalizedOutputOptions
    ): Promise<RenderChunkResult> {
      const result = await minify(code, {
        toplevel: true,
        sourceMap: sourcemap === true,
      });

      return result as Promise<RenderChunkResult>;
    },
  };
}
