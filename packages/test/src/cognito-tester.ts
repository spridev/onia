import {
  AdminCreateUserCommand,
  AdminDeleteUserCommand,
  AdminGetUserCommand,
  AdminInitiateAuthCommand,
  AdminSetUserPasswordCommand,
  CognitoIdentityProviderClient,
  UpdateUserPoolClientCommand,
} from '@aws-sdk/client-cognito-identity-provider';

import { CognitoFlow } from './cognito-flow';
import { CognitoUser } from './cognito-user';

const client = new CognitoIdentityProviderClient({});

export class CognitoTester {
  /**
   * The cognito tester users.
   */
  private $users: Map<CognitoUser['username'], CognitoUser> = new Map();

  /**
   * Create a new cognito tester.
   */
  constructor(
    private $pool: string,
    private $client: string,
    private $flows: CognitoFlow[] = ['ALLOW_REFRESH_TOKEN_AUTH']
  ) {}

  /**
   * Set up the cognito tester.
   */
  async setup(): Promise<void> {
    await this.updateFlows([...this.$flows, 'ALLOW_ADMIN_USER_PASSWORD_AUTH']);
  }

  /**
   * Tear down the cognito tester.
   */
  async teardown(): Promise<void> {
    await this.updateFlows(this.$flows);
    await this.deleteUsers();
  }

  /**
   * Create a user.
   */
  async createUser(username: string, password: string): Promise<CognitoUser> {
    const createResult = await client.send(
      new AdminCreateUserCommand({
        UserPoolId: this.$pool,
        Username: username,
        MessageAction: 'SUPPRESS',
      })
    );

    if (!createResult?.User?.Username) {
      throw new Error('Missing username');
    }

    await client.send(
      new AdminSetUserPasswordCommand({
        UserPoolId: this.$pool,
        Username: username,
        Password: password,
        Permanent: true,
      })
    );

    const initiateResult = await client.send(
      new AdminInitiateAuthCommand({
        UserPoolId: this.$pool,
        ClientId: this.$client,
        AuthFlow: 'ADMIN_USER_PASSWORD_AUTH',
        AuthParameters: {
          USERNAME: username,
          PASSWORD: password,
        },
      })
    );

    if (!initiateResult?.AuthenticationResult?.AccessToken) {
      throw new Error('Missing access token');
    }

    if (!initiateResult?.AuthenticationResult?.RefreshToken) {
      throw new Error('Missing refresh token');
    }

    const user: CognitoUser = {
      id: createResult.User.Username,
      username: username,
      password: password,
      accessToken: initiateResult.AuthenticationResult.AccessToken,
      refreshToken: initiateResult.AuthenticationResult.RefreshToken,
    };

    this.$users.set(user.username, user);

    return user;
  }

  /**
   * Determine if a user exists.
   */
  async containsUser(
    username: string,
    attributes?: Record<string, string>
  ): Promise<boolean> {
    try {
      const result = await client.send(
        new AdminGetUserCommand({
          UserPoolId: this.$pool,
          Username: username,
        })
      );

      if (!attributes) {
        return true;
      }

      if (!result.UserAttributes) {
        return false;
      }

      for (const [name, value] of Object.entries(attributes)) {
        const attribute = result.UserAttributes.find((a) => a.Name === name);

        if (!attribute || attribute.Value !== value) {
          return false;
        }
      }
    } catch {
      return false;
    }

    return true;
  }

  /**
   * Delete a user.
   */
  async deleteUser(username: string): Promise<void> {
    await client.send(
      new AdminDeleteUserCommand({
        UserPoolId: this.$pool,
        Username: username,
      })
    );

    this.$users.delete(username);
  }

  /**
   * Delete all users.
   */
  async deleteUsers(): Promise<void> {
    for (const user of this.$users.values()) {
      await this.deleteUser(user.username);
    }
  }

  /**
   * Update the authentication flows.
   */
  async updateFlows(flows: CognitoFlow[]): Promise<void> {
    await client.send(
      new UpdateUserPoolClientCommand({
        UserPoolId: this.$pool,
        ClientId: this.$client,
        ExplicitAuthFlows: flows,
      })
    );
  }
}
