import { Topic } from '../entities/Topic';
import { TopicRepositoryPort } from '../ports/TopicRepositoryPort';
import { CustomerRepositoryPort } from '../../customer/ports/CustomerRepositoryPort';

export interface AddTopicFeatureData {
  customerId: string;
  subject: string;
}

export class AddTopicFeature {
  constructor(
    private readonly topicRepository: TopicRepositoryPort,
    private readonly customerRepository: CustomerRepositoryPort
  ) {}

  /**
   * Executes the AddTopic feature with validation
   * @param data The data containing customerId and subject
   * @returns Promise<Topic> The created topic
   * @throws Error if customer doesn't exist or topic already exists
   */
  async execute(data: AddTopicFeatureData): Promise<Topic> {
    const { customerId, subject } = data;

    // Step 1: Verify customer exists
    const customer = await this.customerRepository.findById(customerId);
    if (!customer) {
      throw new Error(`Customer with ID ${customerId} not found`);
    }

    // Step 2: Check if topic with same subject already exists for this customer
    const topicExists = await this.topicRepository.existsByCustomerIdAndSubject(customerId, subject);

    if (topicExists) {
      throw new Error(`Topic with subject "${subject}" already exists for customer ${customer.customerName}`);
    }

    // Step 3: Create and save the new topic
    const newTopic = new Topic(customerId, subject);
    const savedTopic = await this.topicRepository.save(newTopic);

    return savedTopic;
  }
} 