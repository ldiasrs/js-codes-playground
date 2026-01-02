/**
 * Port for cleaning up related operations when a topic's lifecycle changes.
 * This port isolates the topic feature from implementation details of background operations.
 * Implementations handle cleanup of any pending work, processes, or operations related to topics.
 */
export interface TopicLifecycleCleanupPort {
  /**
   * Cleans up all related operations when a topic is deleted.
   * @param topicId The topic ID being deleted
   * @param relatedEntityIds Array of related entity IDs (e.g., topic history IDs) that also need cleanup
   * @returns Promise<void>
   */
  cleanupOnDeletion(topicId: string, relatedEntityIds: string[]): Promise<void>;
}

