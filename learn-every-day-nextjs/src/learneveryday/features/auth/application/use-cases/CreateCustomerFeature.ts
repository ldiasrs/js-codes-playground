import { Customer, CustomerTier } from '../../domain/Customer';
import { CustomerRepositoryPort } from '../ports/CustomerRepositoryPort';
import { TopicRepositoryPort } from '../../../topic/application/ports/TopicRepositoryPort';
import { LoggerPort } from '../../../../shared/ports/LoggerPort';
import { CustomerDTO } from '../dto/CustomerDTO';
import { CustomerMapper } from '../dto/CustomerMapper';

export interface CreateCustomerFeatureData {
  customerName: string;
  govIdentification: {
    type: string;
    content: string;
  };
  email: string;
  phoneNumber: string;
  tier?: CustomerTier;
}

export class CreateCustomerFeature {
  constructor(
    private readonly customerRepository: CustomerRepositoryPort,
    private readonly topicRepository: TopicRepositoryPort,
    private readonly logger: LoggerPort
  ) {}

  /**
   * Executes the CreateCustomer feature
   * @param data The data containing customerName, govIdentification, email, phoneNumber, and optional tier
   * @returns Promise<CustomerDTO> The created customer DTO
   * @throws Error if customer creation fails
   */
  async execute(data: CreateCustomerFeatureData): Promise<CustomerDTO> {
    const { customerName, govIdentification, email, phoneNumber, tier = CustomerTier.Basic } = data;

    // Step 1: Create customer based on identification type
    let customer: Customer;
    if (govIdentification.type === 'CPF') {
      customer = Customer.createWithCPF(customerName, govIdentification.content, email, phoneNumber, undefined, tier);
    } else {
      customer = Customer.createWithOtherId(customerName, govIdentification.content, email, phoneNumber, undefined, tier);
    }

    // Step 2: Save the customer
    const savedCustomer = await this.customerRepository.save(customer);

    this.logger.info(`Created customer ${savedCustomer.id}`, { 
      customerId: savedCustomer.id,
      customerName: savedCustomer.customerName,
      email: savedCustomer.email,
      tier: savedCustomer.tier
    });

    return CustomerMapper.toDTO(savedCustomer);
  }
} 