import { BaseQuery } from '../Query';
import { TopicRepositoryPort } from '../../../domain/topic/ports/TopicRepositoryPort';
import { TopicHistoryRepositoryPort } from '../../../domain/topic-history/ports/TopicHistoryRepositoryPort';

export interface Statistics {
  totalTopics: number;
  totalTopicHistory: number;
  topicsCreatedToday: number;
  topicsCreatedThisWeek: number;
  topicsCreatedThisMonth: number;
  topicHistoryCreatedToday: number;
  topicHistoryCreatedThisWeek: number;
  topicHistoryCreatedThisMonth: number;
  averageHistoryPerTopic: number;
}

export class GetStatisticsQuery extends BaseQuery<Statistics> {
  constructor(
    private readonly topicRepository: TopicRepositoryPort,
    private readonly topicHistoryRepository: TopicHistoryRepositoryPort
  ) {
    super();
  }

  async execute(): Promise<Statistics> {
    const allTopics = await this.topicRepository.findAll();
    const allTopicHistory = await this.topicHistoryRepository.findAll();
    
    const topicsCreatedToday = await this.topicRepository.getTopicsCreatedToday();
    const topicsCreatedThisWeek = await this.topicRepository.getTopicsCreatedThisWeek();
    const topicsCreatedThisMonth = await this.topicRepository.getTopicsCreatedThisMonth();
    
    const topicHistoryCreatedToday = await this.topicHistoryRepository.getTopicHistoryCreatedToday();
    const topicHistoryCreatedThisWeek = await this.topicHistoryRepository.getTopicHistoryCreatedThisWeek();
    const topicHistoryCreatedThisMonth = await this.topicHistoryRepository.getTopicHistoryCreatedThisMonth();
    
    const averageHistoryPerTopic = allTopics.length > 0 ? allTopicHistory.length / allTopics.length : 0;
    
    return {
      totalTopics: allTopics.length,
      totalTopicHistory: allTopicHistory.length,
      topicsCreatedToday: topicsCreatedToday.length,
      topicsCreatedThisWeek: topicsCreatedThisWeek.length,
      topicsCreatedThisMonth: topicsCreatedThisMonth.length,
      topicHistoryCreatedToday: topicHistoryCreatedToday.length,
      topicHistoryCreatedThisWeek: topicHistoryCreatedThisWeek.length,
      topicHistoryCreatedThisMonth: topicHistoryCreatedThisMonth.length,
      averageHistoryPerTopic
    };
  }
} 