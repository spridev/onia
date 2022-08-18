import { AWSEvent } from './aws-event';

import type { Server } from '@hapi/hapi';

export type WireBuilder =
  | Server
  | ((event: AWSEvent) => Server | Promise<Server>);
