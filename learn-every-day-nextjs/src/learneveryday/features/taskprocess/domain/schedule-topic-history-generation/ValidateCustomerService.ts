import { Customer } from "@/learneveryday/features/auth/domain/Customer";
import { CustomerRepositoryPort } from "@/learneveryday/features/auth/application/ports/CustomerRepositoryPort";
import { LoggerPort } from "@/learneveryday/shared/ports/LoggerPort";

/**
 * Validates and retrieves a customer by ID.
 * Returns null if customer is not found (non-throwing validation).
 */
export class ValidateCustomerService {
  constructor(
    private readonly customerRepository: CustomerRepositoryPort,
    private readonly logger: LoggerPort
  ) {}

  /**
   * Validates and retrieves a customer by ID.
   * @param customerId The customer ID to validate
   * @returns Promise<Customer | null> The customer if found, null otherwise
   */
  async execute(customerId: string): Promise<Customer | null> {
    const customer = await this.customerRepository.findById(customerId);
    if (!customer) {
      this.logger.warn(`Customer ${customerId} not found during validation`, {
        customerId
      });
      return null;
    }
    return customer;
  }
}

