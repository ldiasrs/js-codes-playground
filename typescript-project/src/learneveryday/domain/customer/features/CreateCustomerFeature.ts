import { Customer } from '../entities/Customer';
import { CustomerRepositoryPort } from '../ports/CustomerRepositoryPort';
import { TopicRepositoryPort } from '../../topic/ports/TopicRepositoryPort';

export interface CreateCustomerFeatureData {
  customerName: string;
  govIdentification: {
    type: string;
    content: string;
  };
}

export class CreateCustomerFeature {
  constructor(
    private readonly customerRepository: CustomerRepositoryPort,
    private readonly topicRepository: TopicRepositoryPort
  ) {}

  /**
   * Executes the CreateCustomer feature
   * @param data The data containing customerName and govIdentification
   * @returns Promise<{customer: Customer, topics: Topic[]}> The created customer and their topics
   * @throws Error if customer creation fails
   */
  async execute(data: CreateCustomerFeatureData): Promise<{customer: Customer, topics: any[]}> {
    const { customerName, govIdentification } = data;

    // Step 1: Create customer based on identification type
    let customer: Customer;
    if (govIdentification.type === 'CPF') {
      customer = Customer.createWithCPF(customerName, govIdentification.content);
    } else {
      customer = Customer.createWithOtherId(customerName, govIdentification.content);
    }

    // Step 2: Save the customer
    const savedCustomer = await this.customerRepository.save(customer);

    // Step 3: Get customer's topics
    const topics = await this.topicRepository.findByCustomerId(savedCustomer.id || '');

    return { customer: savedCustomer, topics };
  }
} 