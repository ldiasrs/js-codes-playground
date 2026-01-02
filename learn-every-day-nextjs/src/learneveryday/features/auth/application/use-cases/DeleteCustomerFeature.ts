import { Customer } from '../../domain/Customer';
import { CustomerRepositoryPort } from '../ports/CustomerRepositoryPort';
import { CustomerDeletionService } from '../services/CustomerDeletionService';
import { CustomerDeletionSaga } from '../sagas/CustomerDeletionSaga';
import { DomainError } from '../../../../shared/errors/DomainError';

export interface DeleteCustomerFeatureData {
  id: string;
}

export class DeleteCustomerFeature {
  constructor(
    private readonly customerRepository: CustomerRepositoryPort,
    private readonly customerDeletionService: CustomerDeletionService,
    private readonly customerDeletionSaga: CustomerDeletionSaga
  ) {}

  /**
   * Executes the DeleteCustomer feature
   * @param data The data containing the customer id to delete
   * @returns Promise<boolean> True if customer was deleted successfully
   * @throws Error if customer doesn't exist or deletion fails
   */
  async execute(data: DeleteCustomerFeatureData): Promise<boolean> {
    const { id } = data;

    await this.validateCustomerExists(id);

    try {
      await this.customerDeletionService.deleteCustomerTopics(id);
      await this.deleteCustomer(id);
    } catch (error) {
      await this.customerDeletionSaga.compensate(id, error);
      throw error;
    }

    return true;
  }

  /**
   * Validates that the customer exists
   * @param customerId The customer ID
   * @returns Promise<Customer> The customer entity
   * @throws DomainError if customer is not found
   */
  private async validateCustomerExists(customerId: string): Promise<Customer> {
    const customer = await this.customerRepository.findById(customerId);
    if (!customer) {
      throw new DomainError(DomainError.CUSTOMER_NOT_FOUND, `Customer with ID ${customerId} not found`);
    }
    return customer;
  }

  /**
   * Deletes the customer
   * @param customerId The customer ID
   * @throws DomainError if deletion fails
   */
  private async deleteCustomer(customerId: string): Promise<void> {
    const deleted = await this.customerRepository.delete(customerId);
    if (!deleted) {
      throw new DomainError(DomainError.CUSTOMER_DELETION_FAILED, `Failed to delete customer with ID ${customerId}`);
    }
  }
} 