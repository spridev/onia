import { MetadataBearer } from '@aws-sdk/types';

import { CommandStub } from './command-stub';
import { Mock } from './mock';

export class CommandMock<
  TInput extends object,
  TOutput extends MetadataBearer
> extends Mock<TInput, TOutput> {
  /**
   * Create a new command mock.
   */
  constructor(stub: CommandStub<TInput, TOutput>) {
    super(stub);
  }

  /**
   * Make the stub return the given value.
   */
  resolves(
    value: Partial<TOutput> | PromiseLike<Partial<TOutput>>
  ): CommandMock<TInput, TOutput> {
    this.$stub.resolves(value);

    return this;
  }

  /**
   * Make the stub return the given error.
   */
  rejects(error: string | Error): CommandMock<TInput, TOutput> {
    this.$stub.rejects(error);

    return this;
  }

  /**
   * Make the stub call the provided function.
   */
  handle(h: (input: TInput) => Partial<TOutput>): CommandMock<TInput, TOutput> {
    this.$stub.callsFake((command) => h(command.input));

    return this;
  }

  /**
   * Define the command behavior on the nth call.
   */
  onCall(n: number): CommandMock<TInput, TOutput> {
    return new CommandMock(this.$stub.onCall(n));
  }
}
