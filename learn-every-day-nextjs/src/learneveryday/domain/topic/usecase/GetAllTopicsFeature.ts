import { Topic } from '../entities/Topic';
import { TopicRepositoryPort } from '../ports/TopicRepositoryPort';
import { CustomerRepositoryPort } from '../../customer/ports/CustomerRepositoryPort';
import { LoggerPort } from '../../shared/ports/LoggerPort';

export interface GetAllTopicsFeatureData {
  customerId: string;
}

export class GetAllTopicsFeature {
  constructor(
    private readonly topicRepository: TopicRepositoryPort,
    private readonly customerRepository: CustomerRepositoryPort,
    private readonly logger: LoggerPort
  ) {}

  /**
   * Executes the GetAllTopics feature with validation
   * @param data The data containing customerId
   * @returns Promise<Topic[]> Array of topics for the customer
   * @throws Error if customer doesn't exist
   */
  async execute(data: GetAllTopicsFeatureData): Promise<Topic[]> {
    const { customerId } = data;

    // Step 1: Verify customer exists
    const customer = await this.customerRepository.findById(customerId);
    if (!customer) {
      throw new Error(`Customer with ID ${customerId} not found`);
    }

    // Step 2: Get all topics for the customer
    const topics = await this.topicRepository.findByCustomerId(customerId);

    this.logger.info(`Retrieved ${topics.length} topics for customer ${customerId}`, {
      customerId: customerId,
      topicCount: topics.length
    });

    return topics;
  }
} 