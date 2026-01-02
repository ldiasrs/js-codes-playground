import { TopicRepositoryPort } from '../ports/TopicRepositoryPort';
import { TopicHistoryRepositoryPort } from '../../../topic-histoy/application/ports/TopicHistoryRepositoryPort';
import { TopicLifecycleCleanupPort } from '../ports/TopicLifecycleCleanupPort';
import { LoggerPort } from '../../../../shared/ports/LoggerPort';

/**
 * Application service for orchestrating topic deletion.
 * Handles cascade deletion of related entities (task processes, topic histories).
 */
export class TopicDeletionService {
  constructor(
    private readonly topicRepository: TopicRepositoryPort,
    private readonly topicHistoryRepository: TopicHistoryRepositoryPort,
    private readonly topicLifecycleCleanup: TopicLifecycleCleanupPort,
    private readonly logger: LoggerPort
  ) {}

  /**
   * Deletes all related entities for a topic (task processes and topic histories).
   * @param topicId The topic ID
   * @returns Promise<void>
   */
  async deleteRelatedEntities(topicId: string): Promise<void> {
    await this.deleteRelatedOperations(topicId);
    await this.deleteTopicHistories(topicId);
  }

  /**
   * Deletes all related operations for the topic
   * @param topicId The topic ID
   */
  private async deleteRelatedOperations(topicId: string): Promise<void> {
    const topicHistories = await this.topicHistoryRepository.findByTopicId(topicId);
    const topicHistoryIds = topicHistories.map(th => th.id);

    await this.topicLifecycleCleanup.cleanupOnDeletion(topicId, topicHistoryIds);

    this.logger.info(`Cleaned up related operations for topic: ${topicId}`, {
      topicId,
      relatedEntityCount: topicHistories.length
    });
  }

  /**
   * Deletes all topic histories for the topic
   * @param topicId The topic ID
   */
  private async deleteTopicHistories(topicId: string): Promise<void> {
    try {
      await this.topicHistoryRepository.deleteByTopicId(topicId);
    } catch (error) {
      // If deleteByTopicId is not implemented, we'll continue
      this.logger.warn('Could not delete topic history', {
        topicId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  }
}

