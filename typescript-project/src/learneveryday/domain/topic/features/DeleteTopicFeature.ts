import { TopicRepositoryPort } from '../ports/TopicRepositoryPort';
import { TopicHistoryRepositoryPort } from '../../topic-history/ports/TopicHistoryRepositoryPort';

export interface DeleteTopicFeatureData {
  id: string;
}

export class DeleteTopicFeature {
  constructor(
    private readonly topicRepository: TopicRepositoryPort,
    private readonly topicHistoryRepository: TopicHistoryRepositoryPort
  ) {}

  /**
   * Executes the DeleteTopic feature
   * @param data The data containing the topic id to delete
   * @returns Promise<boolean> True if topic was deleted successfully
   * @throws Error if topic doesn't exist or deletion fails
   */
  async execute(data: DeleteTopicFeatureData): Promise<boolean> {
    const { id } = data;

    // Step 1: Check if topic exists
    const existingTopic = await this.topicRepository.findById(id);
    if (!existingTopic) {
      throw new Error(`Topic with ID ${id} not found`);
    }

    // Step 2: Delete topic history first (if any)
    // Note: This would need to be implemented in TopicHistoryRepository
    // For now, we'll just delete the topic
    try {
      await this.topicHistoryRepository.deleteByTopicId(id);
    } catch (error) {
      // If deleteByTopicId is not implemented, we'll continue
      console.warn('Could not delete topic history:', error);
    }

    // Step 3: Delete the topic
    const deleted = await this.topicRepository.delete(id);
    if (!deleted) {
      throw new Error(`Failed to delete topic with ID ${id}`);
    }

    return true;
  }
} 