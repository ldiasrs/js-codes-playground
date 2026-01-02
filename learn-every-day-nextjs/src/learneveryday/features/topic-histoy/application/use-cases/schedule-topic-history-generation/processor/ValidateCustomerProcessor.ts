import { CustomerRepositoryPort } from "../../../../../auth/application/ports/CustomerRepositoryPort";
import { LoggerPort } from "../../../../../../shared/ports/LoggerPort";
import { Customer } from "../../../../../auth/domain/Customer";

/**
 * Validates and loads the customer or returns null and logs when not found.
 */
export class ValidateCustomerProcessor {
  constructor(
    private readonly customerRepository: CustomerRepositoryPort,
    private readonly logger: LoggerPort
  ) {}

  async execute(customerId: string): Promise<Customer | null> {
    const customer = await this.customerRepository.findById(customerId);
    if (!customer) {
      this.logger.error(`Customer with ID ${customerId} not found`, undefined, {
        customerId
      });
      return null;
    }
    return customer;
  }
}


