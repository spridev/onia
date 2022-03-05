import { MetadataBearer } from '@aws-sdk/types';

import { CommandCall } from './command-call';
import { CommandStub } from './command-stub';

export class Mock<TInput extends object, TOutput extends MetadataBearer> {
  /**
   * The sinon stub.
   */
  protected readonly $stub: CommandStub<TInput, TOutput>;

  /**
   * Create a new mock.
   */
  protected constructor(stub: CommandStub<TInput, TOutput>) {
    this.$stub = stub;
    this.$stub.callThrough();
  }

  /**
   * Get the underlying sinon stub.
   */
  stub(): CommandStub<TInput, TOutput> {
    return this.$stub;
  }

  /**
   * Get the number of recorded calls.
   */
  count(): number {
    return this.$stub.callCount;
  }

  /**
   * Determine if the stub was called at least once.
   */
  called(): boolean {
    return this.$stub.called;
  }

  /**
   * Get all recorded calls.
   */
  calls(): (TInput | undefined)[] {
    const calls = this.$stub.getCalls();

    return calls.map((call) => this.input(call));
  }

  /**
   * Get the nth recorded call.
   */
  call(n: number): TInput | undefined {
    const call = this.$stub.getCall(n);

    return this.input(call);
  }

  /**
   * Get the input of the given call.
   */
  private input(call: CommandCall<TInput, TOutput>): TInput | undefined {
    if (!call) return undefined;

    const [command] = call.args;

    return command.input;
  }
}
