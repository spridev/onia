import {
  DescribeParametersCommand,
  GetParametersCommand,
  ParameterStringFilter,
  SSMClient,
  DescribeParametersCommandInput,
} from '@aws-sdk/client-ssm';

import { Hooks } from '../hooks';

const client = new SSMClient({});

export class SSMStore implements Hooks {
  /**
   * The maximum number of parameters to get.
   */
  private static readonly GET_LIMIT = 10;

  /**
   * The ssm parameters.
   */
  private parameters: Record<string, string> = {};

  /**
   * Create and set up a new ssm store.
   */
  static async init(path?: string, decryption?: boolean): Promise<SSMStore> {
    const store = new SSMStore(path, decryption);
    await store.setup();

    return store;
  }

  /**
   * Create a new ssm store.
   */
  constructor(private $path = '', private $decryption = true) {}

  /**
   * Set up the ssm store.
   */
  async setup(): Promise<void> {
    const filters: ParameterStringFilter[] = [];

    if (this.$path.length > 0) {
      filters.push({ Key: 'Name', Option: 'BeginsWith', Values: [this.$path] });
    }

    let nextToken: string | undefined;

    do {
      const input: DescribeParametersCommandInput = {
        ParameterFilters: filters,
      };

      if (nextToken) {
        input.NextToken = nextToken;
      }

      const output = await client.send(new DescribeParametersCommand(input));

      if (!output?.Parameters) {
        throw new Error('Missing parameters');
      }

      const names = output.Parameters.map((parameter) =>
        String(parameter.Name)
      );

      for (let index = 0; index < names.length; index += SSMStore.GET_LIMIT) {
        const output = await client.send(
          new GetParametersCommand({
            Names: names.slice(index, index + SSMStore.GET_LIMIT),
            WithDecryption: this.$decryption,
          })
        );

        if (!output.Parameters) {
          continue;
        }

        for (const parameter of output.Parameters) {
          if (!parameter.Name || !parameter.Value) {
            continue;
          }

          const name = parameter.Name.slice(this.$path.length);

          this.parameters[name] = parameter.Value;
        }
      }

      nextToken = output.NextToken;
    } while (nextToken);
  }

  /**
   * Clean up the ssm store.
   */
  async cleanup(): Promise<void> {
    //
  }

  /**
   * Tear down the ssm store.
   */
  async teardown(): Promise<void> {
    //
  }

  /**
   * Get a parameter.
   */
  getParameter(path: string): string {
    if (!this.parameters[path]) {
      throw new Error('Missing parameter');
    }

    return this.parameters[path];
  }

  /**
   * Get all parameters.
   */
  getParameters(): Record<string, string> {
    return this.parameters;
  }
}
