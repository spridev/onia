export interface Hooks {
  /**
   * Set up resources.
   */
  setup(): Promise<void>;

  /**
   * Clean up resources.
   */
  cleanup(): Promise<void>;

  /**
   * Tear down resources.
   */
  teardown(): Promise<void>;
}
