/**
 * Port for scheduling topic history generation operations.
 * This port isolates the topic feature from implementation details of background operations.
 * Implementations handle scheduling of history generation for topics.
 */
export interface GenerateTopicHistoryPort {
  /**
   * Schedules history generation for a newly created topic.
   * @param topicId The topic ID
   * @param customerId The customer ID
   * @returns Promise<void>
   * @throws Error if scheduling fails
   */
  generate(topicId: string, customerId: string): Promise<void>;
}

