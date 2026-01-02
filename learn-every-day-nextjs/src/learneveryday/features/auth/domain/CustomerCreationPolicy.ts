import { CustomerRepositoryPort } from '../application/ports/CustomerRepositoryPort';
import { DomainError } from '../../../shared/errors/DomainError';

/**
 * Domain service that encapsulates business rules for customer creation.
 * Implements policies that govern when a customer can be created.
 */
export class CustomerCreationPolicy {
  constructor(
    private readonly customerRepository: CustomerRepositoryPort
  ) {}

  /**
   * Validates that a customer can be created with the given email and identification.
   * Checks for duplicate email and identification.
   * @param email The customer email
   * @param govIdentification The government identification
   * @throws DomainError if validation fails
   */
  async canCreateCustomer(email: string, govIdentification: { type: string; content: string }): Promise<void> {
    await this.validateNoDuplicateEmail(email);
    await this.validateNoDuplicateIdentification(govIdentification);
  }

  /**
   * Validates that no customer with the same email exists
   * @param email The email to check
   * @throws DomainError if duplicate email exists
   */
  private async validateNoDuplicateEmail(email: string): Promise<void> {
    const existingCustomer = await this.customerRepository.findByEmail(email);
    if (existingCustomer) {
      throw new DomainError(
        'CUSTOMER_EMAIL_ALREADY_EXISTS',
        `A customer with email ${email} already exists`
      );
    }
  }

  /**
   * Validates that no customer with the same government identification exists
   * @param govIdentification The government identification to check
   * @throws DomainError if duplicate identification exists
   */
  async validateNoDuplicateIdentification(govIdentification: { type: string; content: string }): Promise<void> {
    const existingCustomer = await this.customerRepository.findByGovIdentification(govIdentification);
    if (existingCustomer) {
      throw new DomainError(
        'CUSTOMER_IDENTIFICATION_ALREADY_EXISTS',
        `A customer with this identification already exists`
      );
    }
  }
}

