import { Topic } from '../entities/Topic';

export interface TopicSearchCriteria {
  subject?: string;
  customerId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  hasRecentActivity?: boolean;
  recentActivityHours?: number;
}

export interface TopicRepositoryPort {
  save(topic: Topic): Promise<Topic>;
  findById(id: string): Promise<Topic | undefined>;
  findAll(): Promise<Topic[]>;
  findByCustomerId(customerId: string): Promise<Topic[]>;
  findBySubject(subject: string): Promise<Topic[]>;
  findByDateRange(dateFrom: Date, dateTo: Date): Promise<Topic[]>;
  findWithRecentActivity(hours: number): Promise<Topic[]>;
  search(criteria: TopicSearchCriteria): Promise<Topic[]>;
  delete(id: string): Promise<boolean>;
  count(): Promise<number>;
  getTopicsCreatedToday(): Promise<Topic[]>;
  getTopicsCreatedThisWeek(): Promise<Topic[]>;
  getTopicsCreatedThisMonth(): Promise<Topic[]>;
  
  /**
   * Checks if a topic with the given subject exists for a specific customer
   * @param customerId The customer ID
   * @param subject The topic subject to check
   * @returns Promise<boolean> True if topic exists, false otherwise
   */
  existsByCustomerIdAndSubject(customerId: string, subject: string): Promise<boolean>;
} 