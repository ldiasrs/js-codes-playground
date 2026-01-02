import { Customer } from '../../domain/Customer';
import { CustomerRepositoryPort } from '../ports/CustomerRepositoryPort';
import { DomainError } from '../../../../shared/errors/DomainError';

/**
 * Application service for customer validation operations.
 * Orchestrates repository access to validate customer existence.
 * 
 * Note: This is an application service (not domain service) because it
 * depends on infrastructure (repository). Domain services should contain
 * pure business logic without infrastructure dependencies.
 */
export class CustomerValidationService {
  constructor(
    private readonly customerRepository: CustomerRepositoryPort
  ) {}

  /**
   * Ensures that a customer exists with the given ID.
   * @param customerId The customer ID to validate
   * @returns Promise<Customer> The customer entity
   * @throws DomainError if customer is not found
   */
  async ensureCustomerExists(customerId: string): Promise<Customer> {
    const customer = await this.customerRepository.findById(customerId);
    if (!customer) {
      throw new DomainError(
        DomainError.CUSTOMER_NOT_FOUND,
        `Customer with ID ${customerId} not found`
      );
    }
    return customer;
  }
}

