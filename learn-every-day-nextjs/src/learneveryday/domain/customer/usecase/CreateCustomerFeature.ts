import { Customer } from '../entities/Customer';
import { CustomerRepositoryPort } from '../ports/CustomerRepositoryPort';
import { TopicRepositoryPort } from '../../topic/ports/TopicRepositoryPort';
import { LoggerPort } from '../../shared/ports/LoggerPort';

export interface CreateCustomerFeatureData {
  customerName: string;
  govIdentification: {
    type: string;
    content: string;
  };
  email: string;
  phoneNumber: string;
}

export class CreateCustomerFeature {
  constructor(
    private readonly customerRepository: CustomerRepositoryPort,
    private readonly topicRepository: TopicRepositoryPort,
    private readonly logger: LoggerPort
  ) {}

  /**
   * Executes the CreateCustomer feature
   * @param data The data containing customerName, govIdentification, email, and phoneNumber
   * @returns Promise<Customer> The created customer
   * @throws Error if customer creation fails
   */
  async execute(data: CreateCustomerFeatureData): Promise<Customer> {
    const { customerName, govIdentification, email, phoneNumber } = data;

    // Step 1: Create customer based on identification type
    let customer: Customer;
    if (govIdentification.type === 'CPF') {
      customer = Customer.createWithCPF(customerName, govIdentification.content, email, phoneNumber);
    } else {
      customer = Customer.createWithOtherId(customerName, govIdentification.content, email, phoneNumber);
    }

    // Step 2: Save the customer
    const savedCustomer = await this.customerRepository.save(customer);

    this.logger.info(`Created customer ${savedCustomer.id}`, { 
      customerId: savedCustomer.id,
      customerName: savedCustomer.customerName,
      email: savedCustomer.email 
    });

    return savedCustomer;
  }
} 