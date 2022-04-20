import { AWSResult } from './aws-result';

export class GateToolkit {
  /**
   * The result body.
   */
  private $body = '';

  /**
   * The result code.
   */
  private $code = 200;

  /**
   * The result headers.
   */
  private $headers: Record<string, string[]> = {};

  /**
   * Set the result body.
   */
  body(body: object | string): GateToolkit {
    this.$body = typeof body === 'string' ? body : JSON.stringify(body);

    return this;
  }

  /**
   * Set the result code.
   */
  code(code: number): GateToolkit {
    this.$code = code;

    return this;
  }

  /**
   * Set the given header.
   */
  header(name: string, value: string, append = false): GateToolkit {
    const key = name.toLowerCase();

    if (append) {
      this.$headers[key] = [...(this.$headers[key] ?? []), value];
    } else {
      this.$headers[key] = [value];
    }

    return this;
  }

  /**
   * Set the content-type header.
   */
  type(mime: string): GateToolkit {
    this.header('content-type', mime);

    return this;
  }

  /**
   * Set the content-length header.
   */
  bytes(length: number | string): GateToolkit {
    this.header('content-length', String(length));

    return this;
  }

  /**
   * Set the location header.
   */
  location(uri: string): GateToolkit {
    this.header('location', uri);

    return this;
  }

  /**
   * Set up a '201 Created' result.
   */
  created(location: string): GateToolkit {
    this.code(201).location(location);

    return this;
  }

  /**
   * Set up a '204 No Content' result.
   */
  empty(): GateToolkit {
    this.code(204).body('');

    return this;
  }

  /**
   * Set up a '302 Found' result.
   */
  redirect(location: string): GateToolkit {
    this.code(302).location(location);

    return this;
  }

  /**
   * Build the result.
   */
  build(): AWSResult {
    const result: AWSResult = {};

    result.body = this.$body;
    result.statusCode = this.$code;
    result.headers = Object.fromEntries(
      Object.entries(this.$headers).map(([k, v]) => [k, v.join(',')])
    );

    return result;
  }
}
