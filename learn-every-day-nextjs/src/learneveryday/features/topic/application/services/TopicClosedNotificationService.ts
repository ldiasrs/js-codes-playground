import { Topic } from '../../domain/Topic';
import { CustomerRepositoryPort } from '../../../auth/application/ports/CustomerRepositoryPort';
import { SendTopicClosedEmailPort } from '../ports/SendTopicClosedEmailPort';
import { LoggerPort } from '../../../../shared/ports/LoggerPort';

/**
 * Application service for sending topic closed notifications.
 * Orchestrates the email notification process when a topic is closed.
 */
export class TopicClosedNotificationService {
  constructor(
    private readonly customerRepository: CustomerRepositoryPort,
    private readonly sendTopicClosedEmailPort: SendTopicClosedEmailPort,
    private readonly logger: LoggerPort
  ) {}

  /**
   * Sends a notification email when a topic is closed.
   * @param customerId The customer ID
   * @param topic The closed topic entity
   */
  async sendNotification(customerId: string, topic: Topic): Promise<void> {
    try {
      const customer = await this.customerRepository.findById(customerId);
      if (customer) {
        await this.sendTopicClosedEmailPort.send({
          customerId: customerId,
          email: customer.email,
          topicSubject: topic.subject,
        });
        this.logger.info(`Sent topic closed notification email for topic ${topic.id}`, {
          customerId,
          topicId: topic.id,
          topicSubject: topic.subject
        });
      }
    } catch (error) {
      this.logger.error(
        `Failed to send topic closed email for topic ${topic.id}`,
        error instanceof Error ? error : new Error(String(error)),
        {
          customerId: customerId,
          topicId: topic.id,
          topicSubject: topic.subject,
        }
      );
      // Don't throw - email failure shouldn't prevent topic closure
    }
  }
}

