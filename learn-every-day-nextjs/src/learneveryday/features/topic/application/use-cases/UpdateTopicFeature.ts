import { Topic } from '../../domain/Topic';
import { TopicRepositoryPort } from '../ports/TopicRepositoryPort';
import { TopicUpdatePolicy } from '../../domain/TopicUpdatePolicy';
import { LoggerPort } from '../../../../shared/ports/LoggerPort';
import { DomainError } from '../../../../shared/errors/DomainError';
import { TopicDTO } from '../dto/TopicDTO';
import { TopicMapper } from '../dto/TopicMapper';

export interface UpdateTopicFeatureData {
  id: string;
  subject: string;
}

export class UpdateTopicFeature {
  constructor(
    private readonly topicRepository: TopicRepositoryPort,
    private readonly topicUpdatePolicy: TopicUpdatePolicy,
    private readonly logger: LoggerPort
  ) {}

  /**
   * Executes the UpdateTopic feature with validation
   * @param data The data containing id and new subject
   * @returns Promise<TopicDTO> The updated topic DTO
   * @throws Error if topic doesn't exist or subject is invalid
   */
  async execute(data: UpdateTopicFeatureData): Promise<TopicDTO> {
    const { id, subject } = data;

    const existingTopic = await this.validateTopicExists(id);
    await this.topicUpdatePolicy.canUpdateTopic(existingTopic, subject);

    const updatedTopic = await this.updateTopic(existingTopic, subject.trim());

    return TopicMapper.toDTO(updatedTopic);
  }

  /**
   * Validates that the topic exists
   * @param topicId The topic ID
   * @returns Promise<Topic> The topic entity
   * @throws DomainError if topic is not found
   */
  private async validateTopicExists(topicId: string): Promise<Topic> {
    const topic = await this.topicRepository.findById(topicId);
    if (!topic) {
      throw new DomainError(DomainError.TOPIC_NOT_FOUND, `Topic with ID ${topicId} not found`);
    }
    return topic;
  }

  /**
   * Updates and saves the topic
   * @param existingTopic The existing topic entity
   * @param newSubject The new subject
   * @returns Promise<Topic> The updated topic entity
   */
  private async updateTopic(existingTopic: Topic, newSubject: string): Promise<Topic> {
    const updatedTopic = new Topic(
      existingTopic.customerId,
      newSubject,
      existingTopic.id,
      existingTopic.dateCreated
    );

    const savedTopic = await this.topicRepository.save(updatedTopic);

    this.logger.info(`Updated topic: ${savedTopic.id}`, {
      topicId: savedTopic.id,
      customerId: savedTopic.customerId,
      oldSubject: existingTopic.subject,
      newSubject: savedTopic.subject
    });

    return savedTopic;
  }
} 