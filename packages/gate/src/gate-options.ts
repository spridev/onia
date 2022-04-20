import { GateEvent } from './gate-event';

import type { Schema } from 'joi';

export interface GateOptions<T> {
  /**
   * The authorization rules.
   */
  auth?: {
    scopes?: string[];
  };

  /**
   * The validation rules.
   */
  validate?: Partial<Record<keyof GateEvent<T>, Schema>>;
}
