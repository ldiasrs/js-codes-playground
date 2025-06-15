import { BaseQuery } from '../Query';
import { TopicRepositoryPort } from '../../../domain/ports/TopicRepositoryPort';
import { TopicHistoryRepositoryPort } from '../../../domain/ports/TopicHistoryRepositoryPort';

export interface StatisticsResult {
  totalTopics: number;
  totalHistoryEntries: number;
  topicsCreatedToday: number;
  topicsWithRecentActivity: number;
}

export interface GetStatisticsQueryData {
  // No specific data needed for statistics
}

export class GetStatisticsQuery extends BaseQuery<StatisticsResult> {
  constructor(
    private readonly data: GetStatisticsQueryData,
    private readonly topicRepository: TopicRepositoryPort,
    private readonly topicHistoryRepository: TopicHistoryRepositoryPort
  ) {
    super();
  }

  async execute(): Promise<StatisticsResult> {
    const [
      totalTopics,
      totalHistoryEntries,
      topicsCreatedToday,
      topicsWithRecentActivity
    ] = await Promise.all([
      this.topicRepository.count(),
      this.topicHistoryRepository.count(),
      this.topicRepository.getTopicsCreatedToday().then(topics => topics.length),
      this.topicRepository.findWithRecentActivity(24).then(topics => topics.length)
    ]);

    return {
      totalTopics,
      totalHistoryEntries,
      topicsCreatedToday,
      topicsWithRecentActivity
    };
  }
} 