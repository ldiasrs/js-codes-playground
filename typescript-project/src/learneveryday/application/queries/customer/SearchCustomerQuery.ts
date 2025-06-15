import { BaseQuery } from '../Query';
import { Customer } from '../../../domain/entities/Customer';
import { CustomerRepositoryPort, CustomerSearchCriteria } from '../../../domain/ports/CustomerRepositoryPort';
import { TopicRepositoryPort } from '../../../domain/ports/TopicRepositoryPort';
import { CustomerDTO, CustomerDTOMapper } from '../../dto/CustomerDTO';

export interface SearchCustomerQueryData {
  criteria: CustomerSearchCriteria;
}

export class SearchCustomerQuery extends BaseQuery<CustomerDTO[]> {
  constructor(
    private readonly data: SearchCustomerQueryData,
    private readonly customerRepository: CustomerRepositoryPort,
    private readonly topicRepository: TopicRepositoryPort
  ) {
    super();
  }

  async execute(): Promise<CustomerDTO[]> {
    const { criteria } = this.data;
    const customers = await this.customerRepository.search(criteria);
    
    // Fetch topics for each customer
    const customersWithTopics = await Promise.all(
      customers.map(async (customer) => {
        const topics = await this.topicRepository.findByCustomerId(customer.id || '');
        return CustomerDTOMapper.toDTO(customer, topics);
      })
    );
    
    return customersWithTopics;
  }
} 