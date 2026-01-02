import { TopicRepositoryPort } from '../ports/TopicRepositoryPort';
import { LoggerPort } from '../../../../shared/ports/LoggerPort';

/**
 * Saga for handling topic creation transactions.
 * Implements compensation logic when topic creation operations fail.
 */
export class TopicCreationSaga {
  constructor(
    private readonly topicRepository: TopicRepositoryPort,
    private readonly logger: LoggerPort
  ) {}

  /**
   * Compensates for topic creation if a subsequent operation fails.
   * Attempts to delete the topic to maintain consistency.
   * @param topicId The topic ID to delete
   * @param originalError The original error that triggered compensation
   */
  async compensate(topicId: string, originalError: unknown): Promise<void> {
    try {
      await this.topicRepository.delete(topicId);
      this.logger.warn(`Compensated topic creation: deleted topic ${topicId} due to operation failure`, {
        topicId,
        originalError: originalError instanceof Error ? originalError.message : String(originalError)
      });
    } catch (compensationError) {
      this.logger.error(
        `Failed to compensate topic creation: could not delete topic ${topicId}`,
        compensationError instanceof Error ? compensationError : new Error(String(compensationError)),
        {
          topicId,
          originalError: originalError instanceof Error ? originalError.message : String(originalError)
        }
      );
    }
  }
}

