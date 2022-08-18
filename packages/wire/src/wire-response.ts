import { AWSResult } from './aws-result';

import type { ServerInjectResponse } from '@hapi/hapi';

export class WireResponse {
  /**
   * The raw response.
   */
  private readonly $response: ServerInjectResponse;

  /**
   * Create a new wire response.
   */
  constructor(response: ServerInjectResponse) {
    this.$response = response;
  }

  /**
   * Get the first value of an array.
   */
  private single<T>(value: T | T[]): T {
    return value as T;
  }

  /**
   * The response body.
   */
  private get body(): string {
    const { rawPayload } = this.$response;

    return rawPayload.toString(this.isBase64Encoded ? 'base64' : 'utf8');
  }

  /**
   * The response headers.
   */
  private get headers(): Record<string, string> {
    const { headers } = this.$response;

    if (headers['transfer-encoding'] === 'chunked') {
      throw new Error('API Gateway does not support chunked encoding');
    }

    return headers as Record<string, string>;
  }

  /**
   * The response status code.
   */
  private get statusCode(): number {
    return this.$response.statusCode;
  }

  /**
   * The response encoding.
   */
  private get isBase64Encoded(): boolean {
    const { 'content-type': type, 'content-encoding': encoding } =
      this.$response.headers;

    return (
      Boolean(type && !/; *charset=/.test(this.single(type))) ||
      Boolean(encoding && this.single(encoding) !== 'identity')
    );
  }

  /**
   * Convert Hapi responses to API Gateway results.
   */
  encode(): AWSResult {
    return {
      body: this.body,
      headers: this.headers,
      statusCode: this.statusCode,
      isBase64Encoded: this.isBase64Encoded,
    };
  }
}
