import * as Querystring from 'node:querystring';

import * as Boom from '@hapi/boom';
import * as Hoek from '@hapi/hoek';

import { AWSEvent } from './aws-event';
import { AWSHandler } from './aws-handler';
import { AWSResult } from './aws-result';
import { GateAuth } from './gate-auth';
import { GateEvent } from './gate-event';
import { GateHandler } from './gate-handler';
import { GateOptions } from './gate-options';
import { GateResult } from './gate-result';
import { GateToolkit } from './gate-toolkit';

import type { Context } from 'aws-lambda';

/**
 * The event body parsers.
 */
const parsers = [
  {
    mime: /^text\/.+$/,
    parse: (body?: string) => body,
  },
  {
    mime: /^application\/(?:.+\+)?json$/,
    parse: (body?: string) => (body?.length ? JSON.parse(body) : {}),
  },
  {
    mime: 'application/x-www-form-urlencoded',
    parse: (body?: string) => (body?.length ? Querystring.parse(body) : {}),
  },
];

/**
 * Parse the event auth.
 */
function parseAuth(event: AWSEvent): GateAuth {
  const auth: GateAuth = {};

  const context = event.requestContext ?? {};

  if ('authorizer' in context) {
    const { authorizer } = context;

    if ('jwt' in authorizer) {
      auth.claims = authorizer.jwt.claims;
      auth.scopes = authorizer.jwt.scopes;
    }

    if ('lambda' in authorizer) {
      auth.context = authorizer.lambda;
    }
  }

  return auth;
}

/**
 * Parse the event payload.
 */
function parsePayload<T>(body?: string, type?: string): T {
  if (!type || type.length === 0) {
    throw Boom.badRequest('Missing content-type header');
  }

  const match = type.match(/^([^\s/]+\/[^\s;]+)(.*)?$/);

  if (!match || match.length < 2) {
    throw Boom.badRequest('Invalid content-type header');
  }

  const mime = match[1].toLowerCase();

  const parser = parsers.find((parser) => {
    return parser.mime instanceof RegExp
      ? parser.mime.test(mime)
      : parser.mime === mime;
  });

  if (!parser) {
    throw Boom.unsupportedMediaType();
  }

  try {
    return parser.parse(body) as T;
  } catch {
    throw Boom.badRequest('Invalid request body');
  }
}

/**
 * Clean undefined object values.
 */
function cleanValues<T>(
  source: Record<string, T | undefined> = {}
): Record<string, T> {
  const output: Record<string, T> = {};

  for (const [key, value] of Object.entries(source)) {
    if (value !== undefined) {
      output[key] = value;
    }
  }

  return output;
}

/**
 * Format the given result.
 */
function formatResult(result: GateResult): AWSResult {
  if (result instanceof GateToolkit) {
    return result.build();
  }

  return result;
}

/**
 * Format the given error.
 */
function formatError(error: unknown): AWSResult {
  const boom = error instanceof Error ? Boom.boomify(error) : Boom.internal();

  return new GateToolkit()
    .code(boom.output.statusCode)
    .body(boom.output.payload)
    .build();
}

export class Gate<T> {
  /**
   * The authorization scopes.
   */
  private readonly scopes: Record<string, string[]> = {
    required: [],
    forbidden: [],
    selection: [],
  };

  /**
   * Create a new gate.
   */
  constructor(private $options: GateOptions<T> = {}) {
    if (this.$options.auth?.scopes) {
      for (const value of this.$options.auth.scopes) {
        const [prefix] = value;

        if (prefix === '+') {
          this.scopes.required.push(value.slice(1));
        } else if (prefix === '!') {
          this.scopes.forbidden.push(value.slice(1));
        } else {
          this.scopes.selection.push(value);
        }
      }
    }
  }

  /**
   * Parse the given event.
   */
  private parse(event: AWSEvent, context: Context): GateEvent<T> {
    const headers = cleanValues(event.headers);

    return {
      auth: parseAuth(event),
      query: event.queryStringParameters ?? {},
      params: event.pathParameters ?? {},
      cookies: event.cookies ?? [],
      payload: parsePayload<T>(event.body, headers['content-type']),
      context: context,
      headers: headers,
      raw: event,
    };
  }

  /**
   * Authorize the given event.
   */
  private authorize(event: GateEvent<T>): void {
    const scopes = event.auth.scopes ?? [];

    for (const value of this.scopes.required) {
      if (!scopes.includes(value)) {
        throw Boom.forbidden();
      }
    }

    for (const value of this.scopes.forbidden) {
      if (scopes.includes(value)) {
        throw Boom.forbidden();
      }
    }

    if (this.scopes.selection.length > 0) {
      const intersection = Hoek.intersect(this.scopes.selection, scopes);

      if (intersection.length === 0) {
        throw Boom.forbidden();
      }
    }
  }

  /**
   * Validate the given event.
   */
  private validate(event: GateEvent<T>): GateEvent<T> {
    if (this.$options.validate) {
      const properties = Object.keys(
        this.$options.validate
      ) as (keyof GateEvent<T>)[];

      for (const property of properties) {
        const value = event[property];
        const schema = this.$options.validate[property];

        if (schema) {
          const result = schema.validate(value);

          if (result.error) {
            throw Boom.boomify(result.error, { statusCode: 400 });
          }

          event[property] = result.value;
        }
      }
    }

    return event;
  }

  /**
   * Wrap a lambda handler.
   */
  handler(h: GateHandler<T>): AWSHandler {
    return async (event, context) => {
      try {
        const input = this.parse(event, context);

        this.authorize(input);

        const result = await h(this.validate(input), new GateToolkit());

        return formatResult(result);
      } catch (error: unknown) {
        return formatError(error);
      }
    };
  }
}
