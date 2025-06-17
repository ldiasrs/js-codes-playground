import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { Topic } from '../entities/Topic';
import { TopicRepositoryPort } from '../ports/TopicRepositoryPort';
import { CustomerRepositoryPort } from '../../customer/ports/CustomerRepositoryPort';
import { TYPES } from '../../../infrastructure/di/types';

export interface AddTopicSimpleFeatureData {
  customerId: string;
  subject: string;
}

@injectable()
export class AddTopicSimpleFeature {
  constructor(
    @inject(TYPES.TopicRepository) private readonly topicRepository: TopicRepositoryPort,
    @inject(TYPES.CustomerRepository) private readonly customerRepository: CustomerRepositoryPort
  ) {}

  /**
   * Executes the AddTopic feature (simple version without duplicate validation)
   * @param data The data containing customerId and subject
   * @returns Promise<Topic> The created topic
   * @throws Error if customer doesn't exist
   */
  async execute(data: AddTopicSimpleFeatureData): Promise<Topic> {
    const { customerId, subject } = data;

    // Step 1: Verify customer exists
    const customer = await this.customerRepository.findById(customerId);
    if (!customer) {
      throw new Error(`Customer with ID ${customerId} not found`);
    }

    // Step 2: Create and save the topic
    const newTopic = new Topic(subject, customerId);
    const savedTopic = await this.topicRepository.save(newTopic);

    return savedTopic;
  }
} 