import { SinonStub } from 'sinon';

import { Command } from './command';

export type CommandStub<TInput, TOutput> = SinonStub<
  [Command<TInput, TOutput>, ...any[]]
>;
