import { applyToDefaults } from '@hapi/hoek';

import { AWSEvent } from '../../src';

type DeepPartial<T> = Partial<{ [P in keyof T]: DeepPartial<T[P]> }>;

const event = {
  headers: {},
  rawPath: '',
  rawQueryString: '',
  requestContext: { http: { method: 'GET' } },
};

export function makeEvent(custom: DeepPartial<AWSEvent>): AWSEvent {
  return applyToDefaults(event, custom, { nullOverride: true }) as AWSEvent;
}
