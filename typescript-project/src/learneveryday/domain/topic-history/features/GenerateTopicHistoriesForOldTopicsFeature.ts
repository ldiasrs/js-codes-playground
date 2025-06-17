import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { TopicHistory } from '../entities/TopicHistory';
import { TopicRepositoryPort } from '../../topic/ports/TopicRepositoryPort';
import { GenerateTopicHistoryFeature } from './GenerateTopicHistoryFeature';
import { TYPES } from '../../../infrastructure/di/types';

export interface GenerateTopicHistoriesForOldTopicsFeatureData {
  limit?: number;
  hoursSinceLastUpdate?: number;
}

export interface GenerateTopicHistoriesForOldTopicsFeatureResult {
  processedTopics: number;
  successfulGenerations: number;
  failedGenerations: number;
  errors: Array<{ topicId: string; error: string }>;
}

@injectable()
export class GenerateTopicHistoriesForOldTopicsFeature {
  constructor(
    @inject(TYPES.TopicRepository) private readonly topicRepository: TopicRepositoryPort,
    @inject(TYPES.GenerateTopicHistoryFeature) private readonly generateTopicHistoryFeature: GenerateTopicHistoryFeature
  ) {}

  /**
   * Executes the GenerateTopicHistoriesForOldTopics feature
   * @param data The data containing limit and hoursSinceLastUpdate
   * @returns Promise<GenerateTopicHistoriesForOldTopicsFeatureResult> The result of the operation
   */
  async execute(data: GenerateTopicHistoriesForOldTopicsFeatureData = {}): Promise<GenerateTopicHistoriesForOldTopicsFeatureResult> {
    const { limit = 10, hoursSinceLastUpdate = 24 } = data;

    // Step 1: Fetch topics with oldest histories that haven't been updated in the last 24h
    const topicsWithOldHistories = await this.topicRepository.findTopicsWithOldestHistories(limit, hoursSinceLastUpdate);

    const result: GenerateTopicHistoriesForOldTopicsFeatureResult = {
      processedTopics: topicsWithOldHistories.length,
      successfulGenerations: 0,
      failedGenerations: 0,
      errors: []
    };

    // Step 2: Generate new topic histories for each topic
    for (const topic of topicsWithOldHistories) {
      try {
        await this.generateTopicHistoryFeature.execute({
          topicId: topic.id
        });
        result.successfulGenerations++;
      } catch (error) {
        result.failedGenerations++;
        result.errors.push({
          topicId: topic.id,
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        });
      }
    }

    return result;
  }
} 