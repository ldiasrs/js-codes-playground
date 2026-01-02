import { TaskProcess } from './TaskProcess';
import { TaskProcessRunner } from './TaskProcessRunner';
import { TaskProcessRepositoryPort } from '../ports/TaskProcessRepositoryPort';
import { CustomerRepositoryPort } from '../../auth/application/ports/CustomerRepositoryPort';
import { TopicRepositoryPort } from '../../topic/application/ports/TopicRepositoryPort';
import { TopicHistoryRepositoryPort } from '../../topic-histoy/application/ports/TopicHistoryRepositoryPort';
import { SendTopicHistoryByEmailPort } from '../../topic-histoy/application/ports/SendTopicHistoryByEmailPort';
import { LoggerPort } from '../../../shared/ports/LoggerPort';

export class SendTopicHistoryTaskRunner implements TaskProcessRunner {
  constructor(
    private readonly customerRepository: CustomerRepositoryPort,
    private readonly topicRepository: TopicRepositoryPort,
    private readonly topicHistoryRepository: TopicHistoryRepositoryPort,
    private readonly sendTopicHistoryByEmailPort: SendTopicHistoryByEmailPort,
    private readonly taskProcessRepository: TaskProcessRepositoryPort,
    private readonly logger: LoggerPort
  ) {}

  /**
   * Executes the topic history sending task
   * @param taskProcess The task process containing the topic history ID in entityId
   * @returns Promise<void> Resolves when topic history is sent successfully
   * @throws Error if topic history, topic, or customer not found, or sending fails
   */
  async execute(taskProcess: TaskProcess): Promise<void> {
    const topicHistoryId = taskProcess.entityId;

    // Step 1: Find the topic history
    const topicHistory = await this.topicHistoryRepository.findById(topicHistoryId);
    if (!topicHistory) {
      throw new Error(`Topic history with ID ${topicHistoryId} not found`);
    }

    // Step 2: Find the topic using the topicId from topic history
    const topic = await this.topicRepository.findById(topicHistory.topicId);
    if (!topic) {
      throw new Error(`Topic with ID ${topicHistory.topicId} not found`);
    }

    // Step 3: Check if topic is closed
    if (topic.closed) {
      this.logger.info(`Skipping topic history sending for closed topic: ${topic.id}`, {
        topicHistoryId,
        topicId: topic.id,
        customerId: topic.customerId,
        subject: topic.subject
      });
      throw new Error(`Topic with ID ${topic.id} is closed and cannot send topic history`);
    }

    // Step 4: Find the customer using the customerId from topic
    const customer = await this.customerRepository.findById(topic.customerId);
    if (!customer) {
      throw new Error(`Customer with ID ${topic.customerId} not found`);
    }

    // Step 5: Send the topic history by email
    await this.sendTopicHistoryByEmailPort.send({
      email: customer.email,
      topicHistory: topicHistory,
      topicSubject: topic.subject,
      customerId: customer.id || "not-provided"
    });

    this.logger.info(`Sent topic history ${topicHistoryId} to customer ${customer.email} for topic: ${topic.subject}`, {
      topicHistoryId,
      topicId: topic.id,
      topicSubject: topic.subject,
      customerId: customer.id,
      customerEmail: customer.email
    });
  }
} 