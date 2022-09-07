import type { Server } from '@hapi/hapi';

export type WireBuilder = Server | (() => Server | Promise<Server>);
