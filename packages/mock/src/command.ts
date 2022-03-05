import { Command as AWSCommand, MetadataBearer } from '@aws-sdk/types';

export type Command<
  TCInput extends TInput,
  TCOutput extends TOutput,
  TInput extends object = any,
  TOutput extends MetadataBearer = any
> = AWSCommand<TInput, TCInput, TOutput, TCOutput, unknown>;
