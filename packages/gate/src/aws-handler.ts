import { AWSEvent } from './aws-event';
import { AWSResult } from './aws-result';

import type { Context } from 'aws-lambda';

export type AWSHandler = (
  event: AWSEvent,
  context: Context
) => Promise<AWSResult>;
