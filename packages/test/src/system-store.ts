import {
  DescribeParametersCommand,
  GetParametersCommand,
  ParameterMetadata,
  ParameterStringFilter,
  Parameter,
  SSMClient,
} from '@aws-sdk/client-ssm';

const client = new SSMClient({});

export class SystemStore {
  /**
   * The parameters chunk size.
   */
  private static chunk = 10;

  /**
   * Create a new system store.
   */
  constructor(private $path = '', private $decryption = true) {}

  /**
   * Get all parameters names.
   */
  private async metadata(token?: string): Promise<ParameterMetadata[]> {
    const filters: ParameterStringFilter[] = [];

    if (this.$path.length > 0) {
      filters.push({
        Key: 'Name',
        Option: 'BeginsWith',
        Values: [this.$path],
      });
    }

    const result = await client.send(
      new DescribeParametersCommand({
        NextToken: token,
        ParameterFilters: filters,
      })
    );

    const metadata = result.Parameters ?? [];

    if (result.NextToken) {
      metadata.push(...(await this.metadata(result.NextToken)));
    }

    return metadata;
  }

  /**
   * Get all parameters values.
   */
  private async parameters(names: string[]): Promise<Parameter[]> {
    const parameters: Parameter[] = [];

    for (let index = 0; index < names.length; index += SystemStore.chunk) {
      const result = await client.send(
        new GetParametersCommand({
          Names: names.slice(index, index + SystemStore.chunk),
          WithDecryption: this.$decryption,
        })
      );

      if (result.Parameters) {
        parameters.push(...result.Parameters);
      }
    }

    return parameters;
  }

  /**
   * Populate process.env from parameters.
   */
  async config(prefix = ''): Promise<Record<string, string>> {
    const metadata = await this.metadata();

    const parameters = await this.parameters(
      metadata.map((m) => String(m.Name))
    );

    const output: Record<string, string> = {};

    for (const parameter of parameters) {
      if (!parameter.Name || !parameter.Value) {
        continue;
      }

      let name = parameter.Name;

      name = name.slice(this.$path.length);
      name = prefix + '/' + name;
      name = name.split(/[/-]/g).filter(Boolean).join('_').toUpperCase();

      output[name] = parameter.Value;
    }

    for (const name of Object.keys(output)) {
      if (!process.env.hasOwnProperty(name)) {
        process.env[name] = output[name];
      }
    }

    return output;
  }
}
