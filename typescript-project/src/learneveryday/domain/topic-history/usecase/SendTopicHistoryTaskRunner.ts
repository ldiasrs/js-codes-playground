import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { TaskProcess } from '../../taskprocess/entities/TaskProcess';
import { TaskProcessRunner } from '../../taskprocess/ports/TaskProcessRunner';
import { TaskProcessRepositoryPort } from '../../taskprocess/ports/TaskProcessRepositoryPort';
import { Customer } from '../../customer/entities/Customer';
import { Topic } from '../../topic/entities/Topic';
import { TopicHistory } from '../entities/TopicHistory';
import { CustomerRepositoryPort } from '../../customer/ports/CustomerRepositoryPort';
import { TopicRepositoryPort } from '../../topic/ports/TopicRepositoryPort';
import { TopicHistoryRepositoryPort } from '../ports/TopicHistoryRepositoryPort';
import { SendTopicHistoryByEmailPort } from '../ports/SendTopicHistoryByEmailPort';
import { TYPES } from '../../../infrastructure/di/types';

@injectable()
export class SendTopicHistoryTaskRunner implements TaskProcessRunner {
  constructor(
    @inject(TYPES.CustomerRepository) private readonly customerRepository: CustomerRepositoryPort,
    @inject(TYPES.TopicRepository) private readonly topicRepository: TopicRepositoryPort,
    @inject(TYPES.TopicHistoryRepository) private readonly topicHistoryRepository: TopicHistoryRepositoryPort,
    @inject(TYPES.SendTopicHistoryByEmailPort) private readonly sendTopicHistoryByEmailPort: SendTopicHistoryByEmailPort,
    @inject(TYPES.TaskProcessRepository) private readonly taskProcessRepository: TaskProcessRepositoryPort
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

    // Step 3: Find the customer using the customerId from topic
    const customer = await this.customerRepository.findById(topic.customerId);
    if (!customer) {
      throw new Error(`Customer with ID ${topic.customerId} not found`);
    }

    // Step 4: Send the topic history by email
    await this.sendTopicHistoryByEmailPort.send({
      email: customer.email,
      topicHistory: topicHistory,
      topicSubject: topic.subject
    });

    console.log(`Sent topic history ${topicHistoryId} to customer ${customer.email} for topic: ${topic.subject}`);
  }
} 