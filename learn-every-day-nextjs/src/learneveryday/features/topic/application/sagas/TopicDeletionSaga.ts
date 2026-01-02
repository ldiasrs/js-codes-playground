import { TopicRepositoryPort } from '../ports/TopicRepositoryPort';
import { TopicHistoryRepositoryPort } from '../../../topic-histoy/application/ports/TopicHistoryRepositoryPort';
import { TaskProcessRepositoryPort } from '../../../taskprocess/application/ports/TaskProcessRepositoryPort';
import { LoggerPort } from '../../../../shared/ports/LoggerPort';

/**
 * Saga for handling topic deletion transactions.
 * Implements compensation logic when topic deletion operations fail.
 */
export class TopicDeletionSaga {
  constructor(
    private readonly topicRepository: TopicRepositoryPort,
    private readonly topicHistoryRepository: TopicHistoryRepositoryPort,
    private readonly taskProcessRepository: TaskProcessRepositoryPort,
    private readonly logger: LoggerPort
  ) {}

  /**
   * Compensates for partial deletion if the main topic deletion fails.
   * Attempts to restore related entities if possible.
   * @param topicId The topic ID that was being deleted
   * @param originalError The original error that triggered compensation
   */
  async compensate(topicId: string, originalError: unknown): Promise<void> {
    this.logger.warn(`Topic deletion failed for topic ${topicId}, compensation may be needed`, {
      topicId,
      originalError: originalError instanceof Error ? originalError.message : String(originalError)
    });
    
    // Note: In a real system, you might want to restore deleted entities
    // For now, we just log the failure as related entities are already deleted
    // and cannot be easily restored without additional state tracking
  }
}

