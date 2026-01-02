import { TopicRepositoryPort, TopicSearchCriteria } from '../ports/TopicRepositoryPort';
import { CustomerValidationService } from '../../../auth/application/services/CustomerValidationService';
import { LoggerPort } from '../../../../shared/ports/LoggerPort';
import { TopicDTO } from '../dto/TopicDTO';
import { TopicMapper } from '../dto/TopicMapper';

export interface SearchTopicsFeatureData {
  criteria: TopicSearchCriteria;
}

export class SearchTopicsFeature {
  constructor(
    private readonly topicRepository: TopicRepositoryPort,
    private readonly customerValidationService: CustomerValidationService,
    private readonly logger: LoggerPort
  ) {}

  /**
   * Executes the SearchTopics feature with validation
   * @param data The data containing search criteria
   * @returns Promise<TopicDTO[]> Array of topic DTOs matching the criteria
   * @throws Error if customer doesn't exist (when customerId is provided)
   */
  async execute(data: SearchTopicsFeatureData): Promise<TopicDTO[]> {
    const { criteria } = data;

    // Step 1: Verify customer exists if customerId is provided
    if (criteria.customerId) {
      await this.customerValidationService.ensureCustomerExists(criteria.customerId);
    }

    // Step 2: Search topics using the repository
    const topics = await this.topicRepository.search(criteria);

    this.logger.info(`Searched topics with criteria`, {
      criteria: criteria,
      topicCount: topics.length
    });

    return TopicMapper.toDTOArray(topics);
  }
}

