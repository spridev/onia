/* eslint-disable unicorn/no-null */

import MagicString from 'magic-string';

import type {
  RenderedChunk,
  NormalizedOutputOptions,
  Plugin,
  SourceMapInput,
  TransformResult,
} from 'rollup';

interface RenderChunkResult {
  code: string;
  map?: SourceMapInput;
}

const SHEBANG_RX = /^#!.*/;

/**
 * Plugin to preserve shebang lines.
 */
export function bang(): Plugin {
  const shebangs: Record<string, string> = {};

  return {
    name: 'bang',
    transform(code: string, id: string): TransformResult {
      const match = code.match(SHEBANG_RX);

      if (match) {
        shebangs[id] = match[0];
      }

      code = code.replace(SHEBANG_RX, '');

      return { code, map: null };
    },
    renderChunk(
      code: string,
      chunk: RenderedChunk,
      { sourcemap }: NormalizedOutputOptions
    ): RenderChunkResult {
      const id = chunk.facadeModuleId;

      if (!id || !shebangs[id]) {
        return { code, map: null };
      }

      const magic = new MagicString(code);

      magic.prepend(shebangs[id] + '\n');

      return {
        code: magic.toString(),
        map: sourcemap ? magic.generateMap({ hires: true }) : null,
      };
    },
  };
}
