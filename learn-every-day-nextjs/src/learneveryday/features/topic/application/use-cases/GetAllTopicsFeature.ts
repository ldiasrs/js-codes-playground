import { TopicRepositoryPort } from '../ports/TopicRepositoryPort';
import { CustomerValidationService } from '../../../auth/application/services/CustomerValidationService';
import { LoggerPort } from '../../../../shared/ports/LoggerPort';
import { TopicDTO } from '../dto/TopicDTO';
import { TopicMapper } from '../dto/TopicMapper';

export interface GetAllTopicsFeatureData {
  customerId: string;
}

export class GetAllTopicsFeature {
  constructor(
    private readonly topicRepository: TopicRepositoryPort,
    private readonly customerValidationService: CustomerValidationService,
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
    await this.customerValidationService.ensureCustomerExists(customerId);

    // Step 2: Get all topics for the customer
    const topics = await this.topicRepository.findByCustomerId(customerId);

    this.logger.info(`Retrieved ${topics.length} topics for customer ${customerId}`, {
      customerId: customerId,
      topicCount: topics.length
    });

    return TopicMapper.toDTOArray(topics);
  }
} 