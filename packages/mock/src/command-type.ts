import { Command } from './command';
import { CommandMock } from './command-mock';

export type CommandType<TCommand extends Command<any, any>> =
  TCommand extends Command<any, any, infer TInput, infer TOutput>
    ? CommandMock<TInput, TOutput>
    : never;
