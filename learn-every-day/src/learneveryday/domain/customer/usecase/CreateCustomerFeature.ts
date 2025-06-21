import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { Customer } from '../entities/Customer';
import { CustomerRepositoryPort } from '../ports/CustomerRepositoryPort';
import { TopicRepositoryPort } from '../../topic/ports/TopicRepositoryPort';
import { LoggerPort } from '../../shared/ports/LoggerPort';
import { TYPES } from '../../../infrastructure/di/types';

export interface CreateCustomerFeatureData {
  customerName: string;
  govIdentification: {
    type: string;
    content: string;
  };
  email: string;
  phoneNumber: string;
}

@injectable()
export class CreateCustomerFeature {
  constructor(
    @inject(TYPES.CustomerRepository) private readonly customerRepository: CustomerRepositoryPort,
    @inject(TYPES.TopicRepository) private readonly topicRepository: TopicRepositoryPort,
    @inject(TYPES.Logger) private readonly logger: LoggerPort
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