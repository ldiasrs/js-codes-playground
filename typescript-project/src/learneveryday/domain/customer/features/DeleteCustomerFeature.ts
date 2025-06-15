import { CustomerRepositoryPort } from '../ports/CustomerRepositoryPort';
import { TopicRepositoryPort } from '../../topic/ports/TopicRepositoryPort';

export interface DeleteCustomerFeatureData {
  id: string;
}

export class DeleteCustomerFeature {
  constructor(
    private readonly customerRepository: CustomerRepositoryPort,
    private readonly topicRepository: TopicRepositoryPort
  ) {}

  /**
   * Executes the DeleteCustomer feature
   * @param data The data containing the customer id to delete
   * @returns Promise<boolean> True if customer was deleted successfully
   * @throws Error if customer doesn't exist or deletion fails
   */
  async execute(data: DeleteCustomerFeatureData): Promise<boolean> {
    const { id } = data;

    // Step 1: Check if customer exists
    const existingCustomer = await this.customerRepository.findById(id);
    if (!existingCustomer) {
      throw new Error(`Customer with ID ${id} not found`);
    }

    // Step 2: Delete customer's topics first (if any)
    const customerTopics = await this.topicRepository.findByCustomerId(id);
    for (const topic of customerTopics) {
      await this.topicRepository.delete(topic.id);
    }

    // Step 3: Delete the customer
    const deleted = await this.customerRepository.delete(id);
    if (!deleted) {
      throw new Error(`Failed to delete customer with ID ${id}`);
    }

    return true;
  }
} 