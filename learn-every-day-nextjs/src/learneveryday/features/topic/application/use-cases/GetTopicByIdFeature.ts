import { Topic } from '../../domain/Topic';
import { TopicRepositoryPort } from '../ports/TopicRepositoryPort';
import { CustomerRepositoryPort } from '../../../auth/application/ports/CustomerRepositoryPort';
import { LoggerPort } from '../../../../shared/ports/LoggerPort';
import { TopicDTO } from '../dto/TopicDTO';
import { TopicMapper } from '../dto/TopicMapper';

export interface GetTopicByIdFeatureData {
  topicId: string;
}

export class GetTopicByIdFeature {
  constructor(
    private readonly topicRepository: TopicRepositoryPort,
    private readonly customerRepository: CustomerRepositoryPort,
    private readonly logger: LoggerPort
  ) {}

  /**
   * Executes the GetTopicById feature with validation
   * @param data The data containing topicId
   * @returns Promise<TopicDTO> The topic DTO
   * @throws Error if topic doesn't exist
   */
  async execute(data: GetTopicByIdFeatureData): Promise<TopicDTO> {
    const { topicId } = data;

    // Step 1: Get topic by ID
    const topic = await this.topicRepository.findById(topicId);
    if (!topic) {
      throw new Error(`Topic with ID ${topicId} not found`);
    }

    // Step 2: Verify customer exists
    const customer = await this.customerRepository.findById(topic.customerId);
    if (!customer) {
      throw new Error(`Customer with ID ${topic.customerId} not found`);
    }

    this.logger.info(`Retrieved topic ${topicId} for customer ${topic.customerId}`, {
      topicId: topicId,
      customerId: topic.customerId
    });

    return TopicMapper.toDTO(topic);
  }
}

