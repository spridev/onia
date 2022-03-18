import { promisify } from 'node:util';

import * as Hoek from '@hapi/hoek';

import { Callback, Context } from 'aws-lambda';

import { DeepPartial } from './types/deep-partial';

export class Wrapper<TEvent, TResult> {
  /**
   * The wrapper event.
   */
  private $event: DeepPartial<TEvent> = {};

  /**
   * The wrapper context.
   */
  private $context: DeepPartial<Context> = {};

  /**
   * Create a new wrapper.
   */
  constructor(
    private $handler: (
      event: TEvent,
      context: Context
    ) => Promise<TResult | undefined>
  ) {}

  /**
   * Create a new wrapper from promise.
   */
  static promise<TEvent, TResult>(
    handler: (event: TEvent, context: Context) => Promise<TResult | undefined>
  ): Wrapper<TEvent, TResult> {
    return new Wrapper(handler);
  }

  /**
   * Create a new wrapper from callback.
   */
  static callback<TEvent, TResult>(
    handler: (
      event: TEvent,
      context: Context,
      callback: Callback<TResult>
    ) => void
  ): Wrapper<TEvent, TResult> {
    return new Wrapper(promisify(handler));
  }

  /**
   * Set the wrapper event.
   */
  event(event: DeepPartial<TEvent>): Wrapper<TEvent, TResult> {
    this.$event = event;

    return this;
  }

  /**
   * Set the wrapper context.
   */
  context(context: DeepPartial<Context>): Wrapper<TEvent, TResult> {
    this.$context = context;

    return this;
  }

  /**
   * Call the lambda handler.
   */
  async call(
    event: DeepPartial<TEvent> = {},
    context: DeepPartial<Context> = {}
  ): Promise<TResult | undefined> {
    return this.$handler(
      Hoek.applyToDefaults(this.$event, event) as TEvent,
      Hoek.applyToDefaults(this.$context, context) as Context
    );
  }
}
