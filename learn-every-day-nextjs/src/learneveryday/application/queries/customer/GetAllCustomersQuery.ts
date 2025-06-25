import { BaseQuery } from '../Query';
import { Customer } from '../../../domain/customer/entities/Customer';
import { CustomerRepositoryPort } from '../../../domain/customer/ports/CustomerRepositoryPort';
import { TopicRepositoryPort } from '../../../domain/topic/ports/TopicRepositoryPort';
import { CustomerDTO, CustomerDTOMapper } from '../../dto/CustomerDTO';

export class GetAllCustomersQuery extends BaseQuery<CustomerDTO[]> {
  constructor(
    private readonly customerRepository: CustomerRepositoryPort,
    private readonly topicRepository: TopicRepositoryPort
  ) {
    super();
  }

  async execute(): Promise<CustomerDTO[]> {
    const customers = await this.customerRepository.findAll();
    
    // Fetch topics for each customer
    const customersWithTopics = await Promise.all(
      customers.map(async (customer) => {
        const topics = await this.topicRepository.findByCustomerId(customer.id || '');
        return CustomerDTOMapper.toDTO(customer);
      })
    );
    
    return customersWithTopics;
  }
} 