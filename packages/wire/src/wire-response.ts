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
    const { headers, rawPayload } = this.$response;

    if (headers['transfer-encoding'] === 'chunked') {
      const raw = rawPayload.toString().split('\r\n');

      const parts: string[] = [];

      for (let index = 0; index < raw.length; index += 2) {
        const value = raw[index + 1];

        if (value) {
          parts.push(
            value.slice(0, Math.max(0, Number.parseInt(raw[index], 16)))
          );
        }
      }

      return parts.join('');
    }

    return rawPayload.toString(this.isBase64Encoded ? 'base64' : 'utf8');
  }

  /**
   * The response headers.
   */
  private get headers(): Record<string, string> {
    const { headers } = this.$response;

    if (headers['transfer-encoding'] === 'chunked') {
      delete headers['transfer-encoding'];
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
