/**
 * Convert the given string to PascalCase.
 */
export function toPascalCase(text: string): string {
  return text.replace(/(^\w|-\w)/g, (text) =>
    text.replace(/-/, '').toUpperCase()
  );
}
