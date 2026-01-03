import { LoggerPort } from '../../../shared/ports/LoggerPort';
import { Topic } from '../../topic/domain/Topic';
import { TopicRepositoryPort } from '../../topic/application/ports/TopicRepositoryPort';
import { TopicHistoryRepositoryPort } from '../../topic-histoy/application/ports/TopicHistoryRepositoryPort';
import { CloseTopicFeature } from '../../topic/application/use-cases/CloseTopicFeature';

const MAX_HISTORIES_BEFORE_CLOSE = 4 as const;

/**
 * Checks customer's topics and closes those that reached the maximum histories.
 */
export class CheckAndCloseTopicsWithManyHistoriesService {
  constructor(
    private readonly topicRepository: TopicRepositoryPort,
    private readonly topicHistoryRepository: TopicHistoryRepositoryPort,
    private readonly closeTopicFeature: CloseTopicFeature,
    private readonly logger: LoggerPort,
  ) {}

  /**
   * Execute the process for a given customer.
   */
  async execute(customerId: string): Promise<void> {
    try {
      const topics = await this.topicRepository.findByCustomerId(customerId);
      await this.processTopics(customerId, topics);
    } catch (error) {
      this.logger.error(
        `Error checking and closing topics with many histories for customer ${customerId}`,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  private async processTopics(customerId: string, topics: Topic[]): Promise<void> {
    const openTopics = topics.filter(topic => !topic.closed);
    if (openTopics.length === 0) {
      this.logger.info(`No open topics found for customer ${customerId}`, { customerId });
      return;
    }
    const topicsToClose = await this.findTopicsToClose(openTopics);
    if (topicsToClose.length === 0) {
      return;
    }
    this.logger.info(`Found ${topicsToClose.length} topics to close for customer ${customerId}`, {
      customerId,
      topicsToCloseCount: topicsToClose.length,
      topicIds: topicsToClose.map(t => t.id)
    });
    for (const topic of topicsToClose) {
      await this.closeAndLog(customerId, topic);
    }
  }

  private async findTopicsToClose(openTopics: Topic[]): Promise<Topic[]> {
    const topicsToClose: Topic[] = [];
    for (const topic of openTopics) {
      const histories = await this.topicHistoryRepository.findByTopicId(topic.id);
      if (histories.length >= MAX_HISTORIES_BEFORE_CLOSE) {
        topicsToClose.push(topic);
      }
    }
    return topicsToClose;
  }

  private async closeAndLog(customerId: string, topic: Topic): Promise<void> {
    try {
      await this.closeTopicFeature.execute({ id: topic.id });
      this.logger.info(
        `Closed topic ${topic.id} due to having more than ${MAX_HISTORIES_BEFORE_CLOSE} histories`,
        { topicId: topic.id, customerId, subject: topic.subject }
      );
    } catch (error) {
      this.logger.error(
        `Failed to close topic ${topic.id}`,
        error instanceof Error ? error : new Error(String(error)),
        { customerId, topicId: topic.id }
      );
    }
  }
}


