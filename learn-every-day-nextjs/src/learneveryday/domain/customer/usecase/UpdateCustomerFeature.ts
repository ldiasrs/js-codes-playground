import { Customer } from '../entities/Customer';
import { CustomerRepositoryPort } from '../ports/CustomerRepositoryPort';
import { TopicRepositoryPort } from '../../topic/ports/TopicRepositoryPort';
import { GovIdentification, GovIdentificationType } from '../entities/GovIdentification';
import { Topic } from '../../topic/entities/Topic';

export interface UpdateCustomerFeatureData {
  id: string;
  customerName?: string;
  govIdentification?: {
    type: string;
    content: string;
  };
  email?: string;
  phoneNumber?: string;
}

export class UpdateCustomerFeature {
  constructor(
    private readonly customerRepository: CustomerRepositoryPort,
    private readonly topicRepository: TopicRepositoryPort
  ) {}

  /**
   * Executes the UpdateCustomer feature
   * @param data The data containing id and optional fields to update
   * @returns Promise<{customer: Customer, topics: Topic[]}> The updated customer and their topics
   * @throws Error if customer doesn't exist or update fails
   */
  async execute(data: UpdateCustomerFeatureData): Promise<{customer: Customer, topics: Topic[]}> {
    const { id, customerName, govIdentification, email, phoneNumber } = data;

    // Step 1: Find existing customer
    const existingCustomer = await this.customerRepository.findById(id);
    if (!existingCustomer) {
      throw new Error(`Customer with ID ${id} not found`);
    }

    // Step 2: Convert govIdentification if provided
    let updatedGovIdentification: GovIdentification | undefined;
    if (govIdentification) {
      updatedGovIdentification = {
        type: govIdentification.type as GovIdentificationType,
        content: govIdentification.content
      };
    }

    // Step 3: Create updated customer with new values
    const updatedCustomer = new Customer(
      customerName || existingCustomer.customerName,
      updatedGovIdentification || existingCustomer.govIdentification,
      email || existingCustomer.email,
      phoneNumber || existingCustomer.phoneNumber,
      id,
      existingCustomer.dateCreated
    );

    // Step 4: Save the updated customer
    const savedCustomer = await this.customerRepository.save(updatedCustomer);

    // Step 5: Get customer's topics
    const topics = await this.topicRepository.findByCustomerId(savedCustomer.id || '');

    return { customer: savedCustomer, topics };
  }
} 