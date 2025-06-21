import { BaseQuery } from '../Query';
import { CustomerRepositoryPort } from '../../../domain/customer/ports/CustomerRepositoryPort';
import { TopicRepositoryPort } from '../../../domain/topic/ports/TopicRepositoryPort';
import moment from 'moment';

export interface CustomerStatistics {
  totalCustomers: number;
  customersWithTopics: number;
  customersWithoutTopics: number;
  averageTopicsPerCustomer: number;
  customersCreatedToday: number;
  customersCreatedThisWeek: number;
  customersCreatedThisMonth: number;
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
    const allTopics = await this.topicRepository.findAll();
    
    const customersWithTopics = new Set(allTopics.map(topic => topic.customerId));
    const customersWithoutTopics = allCustomers.filter(customer => !customersWithTopics.has(customer.id || ''));
    
    const averageTopicsPerCustomer = allCustomers.length > 0 ? allTopics.length / allCustomers.length : 0;
    
    const customersCreatedToday = await this.customerRepository.getCustomersCreatedToday();
    const customersCreatedThisWeek = await this.customerRepository.getCustomersCreatedThisWeek();
    const customersCreatedThisMonth = await this.customerRepository.getCustomersCreatedThisMonth();
    
    return {
      totalCustomers: allCustomers.length,
      customersWithTopics: customersWithTopics.size,
      customersWithoutTopics: customersWithoutTopics.length,
      averageTopicsPerCustomer,
      customersCreatedToday: customersCreatedToday.length,
      customersCreatedThisWeek: customersCreatedThisWeek.length,
      customersCreatedThisMonth: customersCreatedThisMonth.length
    };
  }
} 