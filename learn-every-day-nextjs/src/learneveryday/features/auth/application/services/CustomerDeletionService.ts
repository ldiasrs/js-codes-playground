import { CustomerRepositoryPort } from '../ports/CustomerRepositoryPort';
import { TopicRepositoryPort } from '../../../topic/application/ports/TopicRepositoryPort';
import { LoggerPort } from '../../../../shared/ports/LoggerPort';

/**
 * Application service for orchestrating customer deletion.
 * Handles cascade deletion of related entities (topics).
 */
export class CustomerDeletionService {
  constructor(
    private readonly customerRepository: CustomerRepositoryPort,
    private readonly topicRepository: TopicRepositoryPort,
    private readonly logger: LoggerPort
  ) {}

  /**
   * Deletes all topics for a customer.
   * @param customerId The customer ID
   * @returns Promise<void>
   */
  async deleteCustomerTopics(customerId: string): Promise<void> {
    const customerTopics = await this.topicRepository.findByCustomerId(customerId);
    
    for (const topic of customerTopics) {
      await this.topicRepository.delete(topic.id);
    }

    this.logger.info(`Deleted ${customerTopics.length} topics for customer ${customerId}`, {
      customerId,
      deletedTopicsCount: customerTopics.length
    });
  }
}

