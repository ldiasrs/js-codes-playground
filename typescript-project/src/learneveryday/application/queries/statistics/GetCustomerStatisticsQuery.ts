import { BaseQuery } from '../Query';
import { CustomerRepositoryPort } from '../../../domain/ports/CustomerRepositoryPort';
import { TopicRepositoryPort } from '../../../domain/ports/TopicRepositoryPort';
import moment from 'moment';

export interface CustomerStatistics {
  totalCustomers: number;
  customersCreatedToday: number;
  customersCreatedThisWeek: number;
  customersCreatedThisMonth: number;
  customersWithRecentActivity: number;
  averageTopicsPerCustomer: number;
  customersWithNoTopics: number;
  customersWithTopics: number;
  topCustomersByTopicCount: Array<{
    customerId: string;
    customerName: string;
    topicCount: number;
  }>;
}

export class GetCustomerStatisticsQuery extends BaseQuery<CustomerStatistics> {
  constructor(
    private readonly customerRepository: CustomerRepositoryPort,
    private readonly topicRepository: TopicRepositoryPort
  ) {
    super();
  }

  async execute(): Promise<CustomerStatistics> {
    const allCustomers = await this.customerRepository.findAll();
    const customersCreatedToday = await this.customerRepository.getCustomersCreatedToday();
    const customersCreatedThisWeek = await this.customerRepository.getCustomersCreatedThisWeek();
    const customersCreatedThisMonth = await this.customerRepository.getCustomersCreatedThisMonth();
    const customersWithRecentActivity = await this.customerRepository.getCustomersWithRecentActivity(24);

    const totalCustomers = allCustomers.length;
    
    // Fetch topic counts for all customers
    const customerTopicCounts = await Promise.all(
      allCustomers.map(async (customer) => {
        const topics = await this.topicRepository.findByCustomerId(customer.id || '');
        return {
          customerId: customer.id || '',
          customerName: customer.customerName,
          topicCount: topics.length
        };
      })
    );
    
    const customersWithNoTopics = customerTopicCounts.filter(c => c.topicCount === 0).length;
    const customersWithTopics = totalCustomers - customersWithNoTopics;
    
    const totalTopics = customerTopicCounts.reduce((sum, customer) => sum + customer.topicCount, 0);
    const averageTopicsPerCustomer = totalCustomers > 0 ? totalTopics / totalCustomers : 0;

    // Get top 5 customers by topic count
    const topCustomersByTopicCount = customerTopicCounts
      .sort((a, b) => b.topicCount - a.topicCount)
      .slice(0, 5);

    return {
      totalCustomers,
      customersCreatedToday: customersCreatedToday.length,
      customersCreatedThisWeek: customersCreatedThisWeek.length,
      customersCreatedThisMonth: customersCreatedThisMonth.length,
      customersWithRecentActivity: customersWithRecentActivity.length,
      averageTopicsPerCustomer: Math.round(averageTopicsPerCustomer * 100) / 100,
      customersWithNoTopics,
      customersWithTopics,
      topCustomersByTopicCount
    };
  }
} 