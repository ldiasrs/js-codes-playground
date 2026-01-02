import { Customer } from '../../../auth/domain/Customer';
import { TopicRepositoryPort } from '../../application/ports/TopicRepositoryPort';
import { TierLimits } from '../../../../shared/TierLimits';
import { DomainError } from '../../../../shared/errors/DomainError';

/**
 * Domain service that encapsulates business rules for topic creation.
 * Implements policies that govern when a topic can be created.
 */
export class TopicCreationPolicy {
  constructor(
    private readonly topicRepository: TopicRepositoryPort
  ) {}

  /**
   * Validates that a topic can be created for the given customer and subject.
   * Checks tier limits and duplicate prevention.
   * @param customer The customer entity
   * @param subject The topic subject
   * @throws DomainError if any validation fails
   */
  async canCreateTopic(customer: Customer, subject: string): Promise<void> {
    await this.validateTierLimits(customer);
    await this.validateNoDuplicateTopic(customer.id!, subject);
  }

  /**
   * Validates that the customer has not reached their tier-based topic limit
   * @param customer The customer entity
   * @throws DomainError if tier limit is reached
   */
  private async validateTierLimits(customer: Customer): Promise<void> {
    const currentTopicCount = await this.topicRepository.countByCustomerId(customer.id!);
    const canAddMore = TierLimits.canAddMoreTopics(customer.tier, currentTopicCount);

    if (!canAddMore) {
      const maxTopics = TierLimits.getMaxTopicsForTier(customer.tier);
      throw new DomainError(
        DomainError.TOPIC_LIMIT_REACHED,
        `Customer ${customer.customerName} (${customer.tier} tier) has reached the maximum limit of ${maxTopics} topics. ` +
        `Current topics: ${currentTopicCount}. Please upgrade your tier to add more topics.`
      );
    }
  }

  /**
   * Validates that a topic with the same subject doesn't already exist for the customer
   * @param customerId The customer ID
   * @param subject The topic subject to check
   * @throws DomainError if duplicate topic exists
   */
  private async validateNoDuplicateTopic(customerId: string, subject: string): Promise<void> {
    const topicExists = await this.topicRepository.existsByCustomerIdAndSubject(customerId, subject);
    if (topicExists) {
      throw new DomainError(
        DomainError.TOPIC_ALREADY_EXISTS,
        `Topic with subject "${subject}" already exists for customer ${customerId}`
      );
    }
  }
}

