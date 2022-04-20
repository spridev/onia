import { AWSEvent } from './aws-event';
import { GateAuth } from './gate-auth';

import type { Context } from 'aws-lambda';

export interface GateEvent<T> {
  /**
   * The event auth.
   */
  auth: GateAuth;

  /**
   * The event query.
   */
  query: Record<string, any>;

  /**
   * The event params.
   */
  params: Record<string, any>;

  /**
   * The event headers.
   */
  headers: Record<string, string>;

  /**
   * The event cookies.
   */
  cookies: string[];

  /**
   * The event payload.
   */
  payload: T;

  /**
   * The event context.
   */
  context: Context;

  /**
   * The raw event.
   */
  raw: AWSEvent;
}
