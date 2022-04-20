import { GateEvent } from './gate-event';
import { GateResult } from './gate-result';
import { GateToolkit } from './gate-toolkit';

export type GateHandler<T> = (
  event: Readonly<GateEvent<T>>,
  toolkit: Readonly<GateToolkit>
) => GateResult | PromiseLike<GateResult>;
