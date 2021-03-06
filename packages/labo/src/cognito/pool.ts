import {
  AdminCreateUserCommand,
  AdminDeleteUserCommand,
  AdminGetUserCommand,
  AdminInitiateAuthCommand,
  AdminSetUserPasswordCommand,
  CognitoIdentityProviderClient,
  ListUsersCommand,
  ListUsersCommandInput,
  UpdateUserPoolClientCommand,
} from '@aws-sdk/client-cognito-identity-provider';

import { Hooks } from '../hooks';

import { CognitoFlow } from './flow';
import { CognitoUser } from './user';

const cip = new CognitoIdentityProviderClient({});

export class CognitoPool implements Hooks {
  /**
   * The maximum number of users to list.
   */
  private static readonly LIST_LIMIT = 60;

  /**
   * Create and set up a new cognito pool.
   */
  static async init(
    id: string,
    client: string,
    flows?: CognitoFlow[]
  ): Promise<CognitoPool> {
    const pool = new CognitoPool(id, client, flows);
    await pool.setup();

    return pool;
  }

  /**
   * Create a new cognito pool.
   */
  constructor(
    private $id: string,
    private $client: string,
    private $flows: CognitoFlow[] = ['ALLOW_REFRESH_TOKEN_AUTH']
  ) {}

  /**
   * Set up the cognito pool.
   */
  async setup(): Promise<void> {
    await this.updateFlows([...this.$flows, 'ALLOW_ADMIN_USER_PASSWORD_AUTH']);
  }

  /**
   * Clean up the cognito pool.
   */
  async cleanup(): Promise<void> {
    await this.deleteUsers();
  }

  /**
   * Tear down the cognito pool.
   */
  async teardown(): Promise<void> {
    await this.updateFlows(this.$flows);
    await this.deleteUsers();
  }

  /**
   * Update the authentication flows.
   */
  async updateFlows(flows: CognitoFlow[]): Promise<void> {
    await cip.send(
      new UpdateUserPoolClientCommand({
        UserPoolId: this.$id,
        ClientId: this.$client,
        ExplicitAuthFlows: flows,
      })
    );
  }

  /**
   * Create a user.
   */
  async createUser(username: string, password: string): Promise<CognitoUser> {
    const createOutput = await cip.send(
      new AdminCreateUserCommand({
        UserPoolId: this.$id,
        Username: username,
        MessageAction: 'SUPPRESS',
      })
    );

    if (!createOutput?.User?.Username) {
      throw new Error('Missing username');
    }

    await cip.send(
      new AdminSetUserPasswordCommand({
        UserPoolId: this.$id,
        Username: username,
        Password: password,
        Permanent: true,
      })
    );

    const initiateOutput = await cip.send(
      new AdminInitiateAuthCommand({
        UserPoolId: this.$id,
        ClientId: this.$client,
        AuthFlow: 'ADMIN_USER_PASSWORD_AUTH',
        AuthParameters: {
          USERNAME: username,
          PASSWORD: password,
        },
      })
    );

    if (!initiateOutput?.AuthenticationResult?.AccessToken) {
      throw new Error('Missing access token');
    }

    if (!initiateOutput?.AuthenticationResult?.RefreshToken) {
      throw new Error('Missing refresh token');
    }

    return {
      id: createOutput.User.Username,
      username: username,
      password: password,
      accessToken: initiateOutput.AuthenticationResult.AccessToken,
      refreshToken: initiateOutput.AuthenticationResult.RefreshToken,
    };
  }

  /**
   * Delete a user.
   */
  async deleteUser(username: string): Promise<void> {
    await cip.send(
      new AdminDeleteUserCommand({
        UserPoolId: this.$id,
        Username: username,
      })
    );
  }

  /**
   * Delete all users.
   */
  async deleteUsers(): Promise<void> {
    let nextToken: string | undefined;

    do {
      const input: ListUsersCommandInput = {
        UserPoolId: this.$id,
        Limit: CognitoPool.LIST_LIMIT,
      };

      if (nextToken) {
        input.PaginationToken = nextToken;
      }

      const output = await cip.send(new ListUsersCommand(input));

      if (!output?.Users) {
        break;
      }

      for (const user of output.Users) {
        if (user.Username) {
          await this.deleteUser(user.Username);
        }
      }

      nextToken = output.PaginationToken;
    } while (nextToken);
  }

  /**
   * Determine if a user exists.
   */
  async containsUser(
    username: string,
    attributes?: Record<string, string>
  ): Promise<boolean> {
    try {
      const output = await cip.send(
        new AdminGetUserCommand({
          UserPoolId: this.$id,
          Username: username,
        })
      );

      if (!attributes) {
        return true;
      }

      if (!output.UserAttributes) {
        return false;
      }

      for (const [name, value] of Object.entries(attributes)) {
        const attribute = output.UserAttributes.find((a) => a.Name === name);

        if (!attribute || attribute.Value !== value) {
          return false;
        }
      }
    } catch {
      return false;
    }

    return true;
  }
}
