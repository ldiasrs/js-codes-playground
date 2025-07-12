import { TopicHistory } from '../entities/TopicHistory';
import { TopicHistoryRepositoryPort } from '../ports/TopicHistoryRepositoryPort';
import { TopicRepositoryPort } from '../../topic/ports/TopicRepositoryPort';
import { LoggerPort } from '../../shared/ports/LoggerPort';

export interface GetTopicHistoriesFeatureData {
  topicId: string;
}

export class GetTopicHistoriesFeature {
  constructor(
    private readonly topicHistoryRepository: TopicHistoryRepositoryPort,
    private readonly topicRepository: TopicRepositoryPort,
    private readonly logger: LoggerPort
  ) {}

  /**
   * Executes the GetTopicHistories feature with validation
   * @param data The data containing topicId
   * @returns Promise<TopicHistory[]> Array of topic histories for the topic
   * @throws Error if topic doesn't exist
   */
  async execute(data: GetTopicHistoriesFeatureData): Promise<TopicHistory[]> {
    const { topicId } = data;

    // Step 1: Verify topic exists
    const topic = await this.topicRepository.findById(topicId);
    if (!topic) {
      throw new Error(`Topic with ID ${topicId} not found`);
    }

    // Step 2: Get all topic histories for the topic
    const topicHistories = await this.topicHistoryRepository.findByTopicId(topicId);

    // Step 3: Sort histories by creation date (newest first)
    const sortedHistories = topicHistories.sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );

    this.logger.info(`Retrieved ${sortedHistories.length} topic histories for topic ${topicId}`, {
      topicId: topicId,
      topicSubject: topic.subject,
      historiesCount: sortedHistories.length
    });

    return sortedHistories;
  }
} 