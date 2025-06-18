import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { TopicHistory } from '../entities/TopicHistory';
import { TopicRepositoryPort } from '../../topic/ports/TopicRepositoryPort';
import { TopicHistoryRepositoryPort } from '../ports/TopicHistoryRepositoryPort';
import { TYPES } from '../../../infrastructure/di/types';

export interface AddTopicHistoryFeatureData {
  topicId: string;
  content: string;
}

@injectable()
export class AddTopicHistoryFeature {
  constructor(
    @inject(TYPES.TopicRepository) private readonly topicRepository: TopicRepositoryPort,
    @inject(TYPES.TopicHistoryRepository) private readonly topicHistoryRepository: TopicHistoryRepositoryPort
  ) {}

  /**
   * Executes the AddTopicHistory feature
   * @param data The data containing topicId and content
   * @returns Promise<TopicHistory> The created topic history entry
   * @throws Error if topic doesn't exist or creation fails
   */
  async execute(data: AddTopicHistoryFeatureData): Promise<TopicHistory> {
    const { topicId, content } = data;

    // Step 1: Verify topic exists
    const topic = await this.topicRepository.findById(topicId);
    if (!topic) {
      throw new Error(`Topic with ID ${topicId} not found`);
    }

    // Step 2: Create and save the new history entry
    const newHistory = new TopicHistory(topicId, content);
    const savedHistory = await this.topicHistoryRepository.save(newHistory);

    return savedHistory;
  }
} 