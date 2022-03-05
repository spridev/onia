import { promisify } from 'node:util';

import { PartialDeep } from 'type-fest';
import { Callback, Context } from 'aws-lambda';

import { createContext } from './context';

/**
 * Wrap a lambda promise handler.
 */
export function wrapPromiseHandler<TEvent, TResult>(
  handler: (event: TEvent, context: Context) => Promise<TResult>
) {
  return async function (
    event: PartialDeep<TEvent>,
    context?: PartialDeep<Context>
  ): Promise<TResult> {
    return handler(event as TEvent, createContext(context));
  };
}

/**
 * Wrap a lambda callback handler.
 */
export function wrapCallbackHandler<TEvent, TResult>(
  handler: (
    event: TEvent,
    context: Context,
    callback: Callback<TResult>
  ) => void
) {
  return wrapPromiseHandler(promisify(handler));
}
