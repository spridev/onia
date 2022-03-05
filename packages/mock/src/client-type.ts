import { Client } from './client';
import { ClientMock } from './client-mock';

export type ClientType<TClient extends Client<any, any>> =
  TClient extends Client<infer TInput, infer TOutput>
    ? ClientMock<TInput, TOutput>
    : never;
