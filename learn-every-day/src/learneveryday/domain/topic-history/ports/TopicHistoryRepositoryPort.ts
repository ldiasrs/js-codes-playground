import { TopicHistory } from '../entities/TopicHistory';

export interface TopicHistorySearchCriteria {
  topicId?: string;
  content?: string;
  dateFrom?: Date;
  dateTo?: Date;
  hasRecentActivity?: boolean;
  recentActivityHours?: number;
}

export interface TopicHistoryRepositoryPort {
  save(topicHistory: TopicHistory): Promise<TopicHistory>;
  findById(id: string): Promise<TopicHistory | undefined>;
  findAll(): Promise<TopicHistory[]>;
  findByTopicId(topicId: string): Promise<TopicHistory[]>;
  findByContent(content: string): Promise<TopicHistory[]>;
  findByDateRange(dateFrom: Date, dateTo: Date): Promise<TopicHistory[]>;
  findWithRecentActivity(hours: number): Promise<TopicHistory[]>;
  search(criteria: TopicHistorySearchCriteria): Promise<TopicHistory[]>;
  findLastTopicHistoryByCustomerId(customerId: string): Promise<TopicHistory | undefined>;
  delete(id: string): Promise<boolean>;
  deleteByTopicId(topicId: string): Promise<void>;
  count(): Promise<number>;
  getTopicHistoryCreatedToday(): Promise<TopicHistory[]>;
  getTopicHistoryCreatedThisWeek(): Promise<TopicHistory[]>;
  getTopicHistoryCreatedThisMonth(): Promise<TopicHistory[]>;
} 