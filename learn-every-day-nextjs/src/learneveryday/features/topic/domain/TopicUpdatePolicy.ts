import { Topic } from './Topic';
import { TopicRepositoryPort } from '../application/ports/TopicRepositoryPort';
import { DomainError } from '../../../shared/errors/DomainError';

/**
 * Domain service that encapsulates business rules for topic updates.
 * Implements policies that govern when and how a topic can be updated.
 */
export class TopicUpdatePolicy {
  constructor(
    private readonly topicRepository: TopicRepositoryPort
  ) {}

  /**
   * Validates that a topic can be updated with the given subject.
   * Checks if topic is closed, subject is valid, and no duplicate exists.
   * @param topic The existing topic entity
   * @param newSubject The new subject to validate
   * @throws DomainError if any validation fails
   */
  async canUpdateTopic(topic: Topic, newSubject: string): Promise<void> {
    this.validateTopicNotClosed(topic);
    this.validateSubject(newSubject);
    await this.validateNoDuplicateSubject(topic.customerId, newSubject, topic.subject);
  }

  /**
   * Validates that the topic is not closed
   * @param topic The topic entity
   * @throws DomainError if topic is closed
   */
  private validateTopicNotClosed(topic: Topic): void {
    if (topic.closed) {
      throw new DomainError(
        DomainError.TOPIC_CANNOT_BE_UPDATED,
        `Cannot update topic ${topic.id} because it is closed`
      );
    }
  }

  /**
   * Validates that the subject is not empty
   * @param subject The topic subject
   * @throws DomainError if subject is invalid
   */
  private validateSubject(subject: string): void {
    if (!subject || subject.trim().length === 0) {
      throw new DomainError(
        DomainError.INVALID_TOPIC_SUBJECT,
        'Topic subject cannot be empty'
      );
    }
  }

  /**
   * Validates that a topic with the same subject doesn't already exist for the customer
   * (excluding the current topic)
   * @param customerId The customer ID
   * @param newSubject The new subject to check
   * @param currentSubject The current subject of the topic being updated
   * @throws DomainError if duplicate topic exists
   */
  private async validateNoDuplicateSubject(customerId: string, newSubject: string, currentSubject: string): Promise<void> {
    const trimmedSubject = newSubject.trim();
    
    // If subject hasn't changed, no need to check for duplicates
    if (trimmedSubject === currentSubject) {
      return;
    }

    const topicExists = await this.topicRepository.existsByCustomerIdAndSubject(customerId, trimmedSubject);
    if (topicExists) {
      throw new DomainError(
        DomainError.TOPIC_ALREADY_EXISTS,
        `Topic with subject "${trimmedSubject}" already exists for this customer`
      );
    }
  }
}

