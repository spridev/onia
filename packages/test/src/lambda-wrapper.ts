import { promisify } from 'node:util';

import * as Hoek from '@hapi/hoek';

import { DeepPartial } from './types/deep-partial';

import type { Callback, Context } from 'aws-lambda';

export class LambdaWrapper<TEvent, TResult> {
  /**
   * The wrapper event.
   */
  private $event: DeepPartial<TEvent> = {};

  /**
   * The wrapper context.
   */
  private $context: DeepPartial<Context> = {};

  /**
   * Create a new lambda wrapper.
   */
  constructor(
    private $handler: (
      event: TEvent,
      context: Context
    ) => Promise<TResult | undefined>
  ) {}

  /**
   * Create a new lambda wrapper from promise.
   */
  static promise<TEvent, TResult>(
    handler: (event: TEvent, context: Context) => Promise<TResult | undefined>
  ): LambdaWrapper<TEvent, TResult> {
    return new LambdaWrapper(handler);
  }

  /**
   * Create a new lambda wrapper from callback.
   */
  static callback<TEvent, TResult>(
    handler: (
      event: TEvent,
      context: Context,
      callback: Callback<TResult>
    ) => void
  ): LambdaWrapper<TEvent, TResult> {
    return new LambdaWrapper(promisify(handler));
  }

  /**
   * Set the wrapper event.
   */
  event(event: DeepPartial<TEvent>): LambdaWrapper<TEvent, TResult> {
    this.$event = event;

    return this;
  }

  /**
   * Set the wrapper context.
   */
  context(context: DeepPartial<Context>): LambdaWrapper<TEvent, TResult> {
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
    const options = { nullOverride: true };

    return this.$handler(
      Hoek.applyToDefaults(this.$event, event, options) as TEvent,
      Hoek.applyToDefaults(this.$context, context, options) as Context
    );
  }
}
