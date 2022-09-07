import { AWSEvent } from './aws-event';

import type { ServerInjectOptions } from '@hapi/hapi';

export class WireRequest {
  /**
   * The raw event.
   */
  private readonly $event: AWSEvent;

  /**
   * Create a new wire request.
   */
  constructor(event: AWSEvent) {
    this.$event = event;
  }

  /**
   * The request url.
   */
  private get url(): string {
    const { rawQueryString } = this.$event;

    if (rawQueryString?.length > 0) {
      return `${this.path}?${rawQueryString}`;
    }

    return this.path;
  }

  /**
   * The request path.
   */
  private get path(): string {
    const { pathParameters } = this.$event;

    if (pathParameters?.proxy !== undefined) {
      return `/${pathParameters.proxy}`;
    }

    const { rawPath, requestContext } = this.$event;

    if (requestContext?.stage) {
      return rawPath.replace(`/${requestContext.stage}`, '');
    }

    return rawPath;
  }

  /**
   * The request method.
   */
  private get method(): string {
    return this.$event.requestContext?.http?.method;
  }

  /**
   * The request remote address.
   */
  private get remoteAddress(): string {
    return this.$event.requestContext?.http?.sourceIp;
  }

  /**
   * The request headers.
   */
  private get headers(): Record<string, string> {
    const headers: Record<string, string> = {};

    if (this.$event.headers) {
      for (const [key, value] of Object.entries(this.$event.headers)) {
        if (value !== undefined) {
          headers[key] = value;
        }
      }
    }

    if (this.$event.cookies) {
      headers.cookie = this.$event.cookies.join('; ');
    }

    return headers;
  }

  /**
   * The request payload.
   */
  private get payload(): Buffer | string | undefined {
    const { body, isBase64Encoded } = this.$event;

    if (!body) {
      return undefined;
    }

    return isBase64Encoded ? Buffer.from(body, 'base64') : body;
  }

  /**
   * The request auth.
   */
  private get auth(): ServerInjectOptions['auth'] {
    const { requestContext } = this.$event;

    if (!requestContext || !('authorizer' in requestContext)) {
      return undefined;
    }

    const { authorizer } = requestContext;

    if ('jwt' in authorizer) {
      const { scopes, claims } = authorizer.jwt;

      return {
        strategy: 'jwt',
        artifacts: authorizer.jwt,
        credentials: { scope: scopes, ...claims },
      };
    }

    if ('lambda' in authorizer) {
      return {
        strategy: 'lambda',
        artifacts: authorizer.lambda,
        credentials: authorizer.lambda,
      };
    }
  }

  /**
   * Convert API Gateway events to Hapi requests.
   */
  decode(): ServerInjectOptions {
    return {
      url: this.url,
      auth: this.auth,
      method: this.method,
      headers: this.headers,
      payload: this.payload,
      remoteAddress: this.remoteAddress,
    };
  }
}
