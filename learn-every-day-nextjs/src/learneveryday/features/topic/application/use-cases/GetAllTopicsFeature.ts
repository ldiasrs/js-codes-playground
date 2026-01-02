import { TopicRepositoryPort } from '../ports/TopicRepositoryPort';
import { CustomerRepositoryPort } from '../../../auth/application/ports/CustomerRepositoryPort';
import { LoggerPort } from '../../../../shared/ports/LoggerPort';
import { TopicDTO } from '../dto/TopicDTO';
import { TopicMapper } from '../dto/TopicMapper';

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
   * @returns Promise<TopicDTO[]> Array of topic DTOs for the customer
   * @throws Error if customer doesn't exist
   */
  async execute(data: GetAllTopicsFeatureData): Promise<TopicDTO[]> {
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

    return TopicMapper.toDTOArray(topics);
  }
} 