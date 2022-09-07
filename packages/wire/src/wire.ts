import { Server, ServerInjectOptions, ServerInjectResponse } from '@hapi/hapi';

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
   * Create a new wire.
   */
  constructor(builder: WireBuilder) {
    this.$builder = builder;
  }

  /**
   * Inject API Gateway events into the Hapi server.
   */
  async proxy(event: AWSEvent): Promise<AWSResult> {
    const request = new WireRequest(event);

    const response = await this.inject(request.decode());

    return new WireResponse(response).encode();
  }

  /**
   * Inject a request into the Hapi server.
   */
  async inject(options: ServerInjectOptions): Promise<ServerInjectResponse> {
    if (!this.$server) {
      this.$server = await this.build();
    }

    return this.$server.inject(options);
  }

  /**
   * Build a server instance.
   */
  private async build(): Promise<Server> {
    return typeof this.$builder === 'function'
      ? await this.$builder()
      : this.$builder;
  }
}
