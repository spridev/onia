/**
 * Create a type with all keys and nested keys set to optional.
 */
export type DeepPartial<T> = Partial<{ [P in keyof T]: DeepPartial<T[P]> }>;
