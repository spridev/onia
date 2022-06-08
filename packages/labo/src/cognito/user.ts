export type CognitoUser = {
  /**
   * The user id.
   */
  id: string;

  /**
   * The user username.
   */
  username: string;

  /**
   * The user password.
   */
  password: string;

  /**
   * The user access token.
   */
  accessToken: string;

  /**
   * The user refresh token.
   */
  refreshToken: string;
};
