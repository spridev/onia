/**
 * Assert that the given condition is true.
 */
export function invariant(
  condition: unknown,
  message = 'Invariant failed'
): asserts condition {
  if (condition) return;

  throw new Error(message);
}
