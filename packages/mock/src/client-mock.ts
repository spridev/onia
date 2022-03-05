import { MetadataBearer } from '@aws-sdk/types';

import { match, stub } from 'sinon';

import { Class } from './class';
import { Client } from './client';
import { Command } from './command';
import { CommandMock } from './command-mock';
import { CommandStub } from './command-stub';
import { isSinonStub } from './is-sinon-stub';
import { Mock } from './mock';

export class ClientMock<
  TInput extends object,
  TOutput extends MetadataBearer
> extends Mock<TInput, TOutput> {
  /**
   * Create a new client mock.
   */
  constructor(client: Class<Client<TInput, TOutput>>) {
    const { prototype } = client;

    if (isSinonStub(prototype.send)) {
      prototype.send.restore();
    }

    super(stub(prototype, 'send'));
  }

  /**
   * Reset the stub history.
   */
  reset(): void {
    return this.$stub.resetHistory();
  }

  /**
   * Restore the stub behavior.
   */
  restore(): void {
    return this.$stub.restore();
  }

  /**
   * Define the given command behavior.
   */
  on<TCInput extends TInput, TCOutput extends TOutput>(
    command: Class<Command<TCInput, TCOutput>>,
    input?: Partial<TCInput>
  ): CommandMock<TCInput, TCOutput> {
    const matcher = input ? match.has('input', match(input)) : match.any;

    const stub = this.$stub.withArgs(match.instanceOf(command).and(matcher));

    return new CommandMock(stub as unknown as CommandStub<TCInput, TCOutput>);
  }
}
