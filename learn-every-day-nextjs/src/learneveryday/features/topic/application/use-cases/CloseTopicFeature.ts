import { Topic } from '../../domain/Topic';
import { TopicRepositoryPort } from '../ports/TopicRepositoryPort';
import { TopicClosedNotificationService } from '../services/TopicClosedNotificationService';
import { LoggerPort } from '../../../../shared/ports/LoggerPort';
import { DomainError } from '../../../../shared/errors/DomainError';
import { TopicDTO } from '../dto/TopicDTO';
import { TopicMapper } from '../dto/TopicMapper';

export interface CloseTopicFeatureData {
  id: string;
}

export class CloseTopicFeature {
  constructor(
    private readonly topicRepository: TopicRepositoryPort,
    private readonly topicClosedNotificationService: TopicClosedNotificationService,
    private readonly logger: LoggerPort
  ) {}


  /**
   * Executes the CloseTopic feature with validation
   * @param data The data containing topic id
   * @returns Promise<TopicDTO> The updated topic DTO with closed set to true
   * @throws Error if topic doesn't exist or is already closed
   */
  async execute(data: CloseTopicFeatureData): Promise<TopicDTO> {
    const { id } = data;

    const existingTopic = await this.validateTopicExists(id);
    this.validateTopicNotClosed(existingTopic);

    const closedTopic = await this.closeTopic(existingTopic);
    await this.topicClosedNotificationService.sendNotification(closedTopic.customerId, closedTopic);

    return TopicMapper.toDTO(closedTopic);
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
   * Validates that the topic is not already closed
   * @param topic The topic entity
   * @throws DomainError if topic is already closed
   */
  private validateTopicNotClosed(topic: Topic): void {
    if (topic.closed) {
      throw new DomainError(DomainError.TOPIC_ALREADY_CLOSED, `Topic with ID ${topic.id} is already closed`);
    }
  }

  /**
   * Closes and saves the topic
   * @param topic The topic entity to close
   * @returns Promise<Topic> The closed topic entity
   */
  private async closeTopic(topic: Topic): Promise<Topic> {
    const closedTopic = new Topic(
      topic.customerId,
      topic.subject,
      topic.id,
      topic.dateCreated,
      true
    );

    const savedTopic = await this.topicRepository.save(closedTopic);

    this.logger.info(`Closed topic: ${savedTopic.id}`, {
      topicId: savedTopic.id,
      customerId: savedTopic.customerId,
      subject: savedTopic.subject,
      closed: savedTopic.closed
    });

    return savedTopic;
  }
}