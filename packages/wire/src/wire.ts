import { Server, RouteOptions } from '@hapi/hapi';

import { AWSEvent } from './aws-event';
import { AWSResult } from './aws-result';
import { WireBuilder } from './wire-builder';
import { WireRequest } from './wire-request';
import { WireResponse } from './wire-response';

export class Wire {
  /**
   * The server builder.
   */
  private readonly $builder: WireBuilder;

  /**
   * The server instance.
   */
  private $server: Server | undefined;

  /**
   * Create a new server from a single route.
   */
  static single(options: RouteOptions): Wire {
    return new Wire(async function (event) {
      const server = new Server();

      const [method, path] = event.routeKey.replace('+', '*').split(' ');

      server.route({ method, path, options });

      await server.initialize();

      return server;
    });
  }

  /**
   * Create a new wire.
   */
  constructor(builder: WireBuilder) {
    this.$builder = builder;
  }

  /**
   * Proxy API Gateway events to the Hapi server.
   */
  async proxy(event: AWSEvent): Promise<AWSResult> {
    if (!this.$server) {
      this.$server = await this.build(event);
    }

    const request = new WireRequest(event);

    const response = await this.$server.inject(request.decode());

    return new WireResponse(response).encode();
  }

  /**
   * Build the server instance.
   */
  private async build(event: AWSEvent): Promise<Server> {
    return typeof this.$builder === 'function'
      ? await this.$builder(event)
      : this.$builder;
  }
}
