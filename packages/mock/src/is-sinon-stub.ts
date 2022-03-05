import { SinonStub } from 'sinon';

/**
 * Determine if a function is a sinon stub.
 */
export function isSinonStub(value: unknown): value is SinonStub {
  return (value as SinonStub).restore !== undefined;
}
