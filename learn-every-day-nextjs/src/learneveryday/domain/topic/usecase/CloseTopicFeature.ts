import { Topic } from '../entities/Topic';
import { TopicRepositoryPort } from '../ports/TopicRepositoryPort';
import { LoggerPort } from '../../shared/ports/LoggerPort';
import { CustomerRepositoryPort } from '../../customer/ports/CustomerRepositoryPort';
import { SendTopicClosedEmailPort } from '../ports/SendTopicClosedEmailPort';

export interface CloseTopicFeatureData {
  id: string;
}

export class CloseTopicFeature {

  constructor(
    private readonly topicRepository: TopicRepositoryPort,
    private readonly logger: LoggerPort,
    private readonly customerRepository: CustomerRepositoryPort,
    private readonly sendTopicClosedEmailPort: SendTopicClosedEmailPort,
  ) {
  }


  /**
   * Executes the CloseTopic feature with validation
   * @param data The data containing topic id
   * @returns Promise<Topic> The updated topic with closed set to true
   * @throws Error if topic doesn't exist or is already closed
   */
  async execute(data: CloseTopicFeatureData): Promise<Topic> {
    const { id } = data;

    // Step 1: Verify topic exists
    const existingTopic = await this.topicRepository.findById(id);
    if (!existingTopic) {
      throw new Error(`Topic with ID ${id} not found`);
    }

    // Step 2: Check if topic is already closed
    if (existingTopic.closed) {
      throw new Error(`Topic with ID ${id} is already closed`);
    }

    // Step 3: Create updated topic with closed set to true
    const closedTopic = new Topic(
      existingTopic.customerId,
      existingTopic.subject,
      existingTopic.id,
      existingTopic.dateCreated,
      true
    );

    // Step 4: Save the updated topic
    const savedTopic = await this.topicRepository.save(closedTopic);

    // Step 5: Send notification email
    await this.sendTopicClosedNotification(savedTopic.customerId, savedTopic);

    // Step 6: Log the closure
    this.logger.info(`Closed topic: ${savedTopic.id}`, {
      topicId: savedTopic.id,
      customerId: savedTopic.customerId,
      subject: savedTopic.subject,
      closed: savedTopic.closed
    });

    return savedTopic;
  }

  async sendTopicClosedNotification(customerId: string, topic: Topic): Promise<void> {
    try {
      const customer = await this.customerRepository.findById(customerId);
      if (customer) {
        await this.sendTopicClosedEmailPort.send({
          customerId: customerId,
          email: customer.email,
          topicSubject: topic.subject,
        });
      }
    } catch (error) {
      this.logger.error(`Failed to send topic closed email for topic ${topic.id}`, error instanceof Error ? error : new Error(String(error)), {
        customerId: customerId,
        topicId: topic.id,
        topicSubject: topic.subject,
      });
    }
  }
}