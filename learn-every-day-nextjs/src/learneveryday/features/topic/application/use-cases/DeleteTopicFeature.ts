import { Topic } from '../../domain/Topic';
import { TopicRepositoryPort } from '../ports/TopicRepositoryPort';
import { TopicDeletionService } from '../services/TopicDeletionService';
import { LoggerPort } from '../../../../shared/ports/LoggerPort';
import { DomainError } from '../../../../shared/errors/DomainError';

export interface DeleteTopicFeatureData {
  id: string;
}

export class DeleteTopicFeature {
  constructor(
    private readonly topicRepository: TopicRepositoryPort,
    private readonly topicDeletionService: TopicDeletionService,
    private readonly logger: LoggerPort
  ) {}

  /**
   * Executes the DeleteTopic feature
   * @param data The data containing the topic id to delete
   * @returns Promise<boolean> True if topic was deleted successfully
   * @throws Error if topic doesn't exist or deletion fails
   */
  async execute(data: DeleteTopicFeatureData): Promise<boolean> {
    const { id } = data;

    const existingTopic = await this.validateTopicExists(id);

    try {
      await this.topicDeletionService.deleteRelatedEntities(id);
      await this.deleteTopic(id);
    } catch (error) {
     this.logger.error(`Failed to delete topic ${id}`, error instanceof Error ? error : new Error(String(error)), {
      topicId: id,
      topicSubject: existingTopic.subject,
      customerId: existingTopic.customerId
     });
      throw error;
    }

    this.logger.info(`Successfully deleted topic: ${id} and all related data`, {
      topicId: id,
      topicSubject: existingTopic.subject,
      customerId: existingTopic.customerId
    });

    return true;
  }

  /**
   * Validates that the topic exists
   * @param topicId The topic ID
   * @returns Promise<Topic> The topic entity
   * @throws DomainError if topic is not found
   */
  private async validateTopicExists(topicId: string): Promise<Topic> {
    const topic = await this.topicRepository.findById(topicId);
    if (!topic) {
      throw new DomainError(DomainError.TOPIC_NOT_FOUND, `Topic with ID ${topicId} not found`);
    }
    return topic;
  }

  /**
   * Deletes the topic
   * @param topicId The topic ID
   * @throws DomainError if deletion fails
   */
  private async deleteTopic(topicId: string): Promise<void> {
    const deleted = await this.topicRepository.delete(topicId);
    if (!deleted) {
      throw new DomainError(DomainError.TOPIC_DELETION_FAILED, `Failed to delete topic with ID ${topicId}`);
    }
  }
} 