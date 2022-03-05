import { SinonSpyCall } from 'sinon';

import { Command } from './command';

export type CommandCall<TInput, TOutput> = SinonSpyCall<
  [Command<TInput, TOutput>, ...any[]]
>;
