import { promisify } from 'node:util';

import * as Hoek from '@hapi/hoek';

import { Callback, Context } from 'aws-lambda';

import { DeepPartial } from './types/deep-partial';

export class GatewayWrapper<TEvent, TResult> {
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
  ): GatewayWrapper<TEvent, TResult> {
    return new GatewayWrapper(handler);
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
  ): GatewayWrapper<TEvent, TResult> {
    return new GatewayWrapper(promisify(handler));
  }

  /**
   * Set the wrapper event.
   */
  event(event: DeepPartial<TEvent>): GatewayWrapper<TEvent, TResult> {
    this.$event = event;

    return this;
  }

  /**
   * Set the wrapper context.
   */
  context(context: DeepPartial<Context>): GatewayWrapper<TEvent, TResult> {
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
