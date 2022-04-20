export interface GateAuth {
  /**
   * The jwt authorizer claims.
   */
  claims?: Record<string, any>;

  /**
   * The jwt authorizer scopes.
   */
  scopes?: string[];

  /**
   * The lambda authorizer context.
   */
  context?: object;
}
