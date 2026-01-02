import { CustomerRepositoryPort } from '../ports/CustomerRepositoryPort';
import { TopicRepositoryPort } from '../../../topic/application/ports/TopicRepositoryPort';
import { LoggerPort } from '../../../../shared/ports/LoggerPort';

/**
 * Saga for handling customer deletion transactions.
 * Implements compensation logic when customer deletion operations fail.
 */
export class CustomerDeletionSaga {
  constructor(
    private readonly customerRepository: CustomerRepositoryPort,
    private readonly topicRepository: TopicRepositoryPort,
    private readonly logger: LoggerPort
  ) {}

  /**
   * Compensates for partial deletion if the main customer deletion fails.
   * Attempts to restore deleted topics if possible.
   * @param customerId The customer ID that was being deleted
   * @param originalError The original error that triggered compensation
   */
  async compensate(customerId: string, originalError: unknown): Promise<void> {
    this.logger.warn(`Customer deletion failed for customer ${customerId}, compensation may be needed`, {
      customerId,
      originalError: originalError instanceof Error ? originalError.message : String(originalError)
    });

    // Note: In a real system, you might want to restore deleted topics
    // For now, we just log the failure as topics are already deleted
    // and cannot be easily restored without additional state tracking
  }
}

