import { BaseQuery } from '../Query';
import { Customer } from '../../../domain/customer/entities/Customer';
import { CustomerRepositoryPort } from '../../../domain/customer/ports/CustomerRepositoryPort';
import { TopicRepositoryPort } from '../../../domain/topic/ports/TopicRepositoryPort';
import { CustomerDTO, CustomerDTOMapper } from '../../dto/CustomerDTO';

export interface GetCustomerByIdQueryData {
  customerId: string;
}

export class GetCustomerByIdQuery extends BaseQuery<CustomerDTO | undefined> {
  constructor(
    private readonly data: GetCustomerByIdQueryData,
    private readonly customerRepository: CustomerRepositoryPort,
    private readonly topicRepository: TopicRepositoryPort
  ) {
    super();
  }

  async execute(): Promise<CustomerDTO | undefined> {
    const { customerId } = this.data;
    const customer = await this.customerRepository.findById(customerId);
    
    if (!customer) {
      return undefined;
    }

    const topics = await this.topicRepository.findByCustomerId(customerId);
    return CustomerDTOMapper.toDTO(customer, topics);
  }
} 