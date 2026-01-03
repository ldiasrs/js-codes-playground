import { Topic } from '../../domain/Topic';
import { TopicRepositoryPort } from '../ports/TopicRepositoryPort';
import { TopicCreationPolicy } from '../../domain/TopicCreationPolicy';
import { CustomerValidationService } from '../../../auth/application/services/CustomerValidationService';
import { LoggerPort } from '../../../../shared/ports/LoggerPort';
import { TopicDTO } from '../dto/TopicDTO';
import { TopicMapper } from '../dto/TopicMapper';

export interface AddTopicFeatureData {
  customerId: string;
  subject: string;
}

/**
 * Use case for adding a new topic.
 * Orchestrates domain services and application services to create a topic
 * and schedule its history generation.
 */
export class AddTopicFeature {
  constructor(
    private readonly topicRepository: TopicRepositoryPort,
    private readonly customerValidationService: CustomerValidationService,
    private readonly topicCreationPolicy: TopicCreationPolicy,
    private readonly logger: LoggerPort
  ) {}

  /**
   * Executes the AddTopic feature with validation
   * @param data The data containing customerId and subject
   * @returns Promise<TopicDTO> The created topic DTO
   * @throws DomainError if customer doesn't exist, topic already exists, or tier limit exceeded
   */
  async execute(data: AddTopicFeatureData): Promise<TopicDTO> {
    const { customerId, subject } = data;

    const customer = await this.customerValidationService.ensureCustomerExists(customerId);
    await this.topicCreationPolicy.canCreateTopic(customer, subject);

    const topic = await this.createTopic(customerId, subject);

    return TopicMapper.toDTO(topic);
  }

  /**
   * Creates and saves a new topic
   * @param customerId The customer ID
   * @param subject The topic subject
   * @returns Promise<Topic> The created topic entity
   */
  private async createTopic(customerId: string, subject: string): Promise<Topic> {
    const newTopic = new Topic(customerId, subject);
    const savedTopic = await this.topicRepository.save(newTopic);

    this.logger.info(`Created topic: ${savedTopic.id}`, {
      topicId: savedTopic.id,
      customerId: savedTopic.customerId,
      subject: savedTopic.subject
    });

    return savedTopic;
  }
} 