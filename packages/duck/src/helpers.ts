import { createHash } from 'node:crypto';

/**
 * Convert a generator into an array.
 */
export async function collect<T>(generator: AsyncGenerator<T>): Promise<T[]> {
  const items: T[] = [];

  for await (const item of generator) {
    items.push(item);
  }

  return items;
}

/**
 * Hash a value using MD5.
 */
export function hash(value: string): string {
  return createHash('md5').update(value).digest('hex');
}
