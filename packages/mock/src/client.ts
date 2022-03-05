import { Client as AWSClient, MetadataBearer } from '@aws-sdk/types';

export type Client<
  TInput extends object,
  TOutput extends MetadataBearer
> = AWSClient<TInput, TOutput, unknown>;
