import { SerializableInput } from '@onia/dino';

export type TableInput<T extends object> = Omit<
  SerializableInput<T>,
  'TableName'
>;
