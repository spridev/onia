export interface EventBridgeEvent {
  /**
   * The event id.
   */
  id: string;

  /**
   * The event time.
   */
  time: string;

  /**
   * The event source.
   */
  source: string;

  /**
   * The event detail.
   */
  detail: Record<string, any>;

  /**
   * The event detail type.
   */
  detailType: string;

  /**
   * The event resources.
   */
  resources: string[];
}
