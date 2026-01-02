import { Customer, CustomerTier } from '../../domain/Customer';
import { CustomerRepositoryPort } from '../ports/CustomerRepositoryPort';
import { CustomerCreationPolicy } from '../../domain/CustomerCreationPolicy';
import { LoggerPort } from '../../../../shared/ports/LoggerPort';
import { CustomerDTO } from '../dto/CustomerDTO';
import { CustomerMapper } from '../dto/CustomerMapper';
import { GovIdentificationDTO } from '../dto/GovIdentificationDTO';

export interface CreateCustomerFeatureData {
  customerName: string;
  govIdentification: GovIdentificationDTO;
  email: string;
  phoneNumber: string;
  tier?: string;
}

export class CreateCustomerFeature {
  constructor(
    private readonly customerRepository: CustomerRepositoryPort,
    private readonly customerCreationPolicy: CustomerCreationPolicy,
    private readonly logger: LoggerPort
  ) {}

  /**
   * Executes the CreateCustomer feature
   * @param data The data containing customerName, govIdentification, email, phoneNumber, and optional tier
   * @returns Promise<CustomerDTO> The created customer DTO
   * @throws Error if customer creation fails
   */
  async execute(data: CreateCustomerFeatureData): Promise<CustomerDTO> {
    const { customerName, govIdentification, email, phoneNumber, tier } = data;

    await this.customerCreationPolicy.canCreateCustomer(email, govIdentification);

    const customerTier = this.parseTier(tier);
    const customer = await this.createCustomer(customerName, govIdentification, email, phoneNumber, customerTier);

    return CustomerMapper.toDTO(customer);
  }

  /**
   * Parses and validates the tier string to CustomerTier enum
   * @param tierString The tier as string
   * @returns CustomerTier The validated tier enum value
   */
  private parseTier(tierString?: string): CustomerTier {
    if (!tierString) {
      return CustomerTier.Basic;
    }

    const validTiers = Object.values(CustomerTier) as string[];
    if (!validTiers.includes(tierString)) {
      return CustomerTier.Basic;
    }

    return tierString as CustomerTier;
  }

  /**
   * Creates and saves a customer based on identification type
   * @param customerName The customer name
   * @param govIdentification The government identification
   * @param email The customer email
   * @param phoneNumber The customer phone number
   * @param tier The customer tier
   * @returns Promise<Customer> The created customer entity
   */
  private async createCustomer(
    customerName: string,
    govIdentification: { type: string; content: string },
    email: string,
    phoneNumber: string,
    tier: CustomerTier
  ): Promise<Customer> {
    let customer: Customer;
    if (govIdentification.type === 'CPF') {
      customer = Customer.createWithCPF(customerName, govIdentification.content, email, phoneNumber, undefined, tier);
    } else {
      customer = Customer.createWithOtherId(customerName, govIdentification.content, email, phoneNumber, undefined, tier);
    }

    const savedCustomer = await this.customerRepository.save(customer);

    this.logger.info(`Created customer ${savedCustomer.id}`, {
      customerId: savedCustomer.id,
      customerName: savedCustomer.customerName,
      email: savedCustomer.email,
      tier: savedCustomer.tier
    });

    return savedCustomer;
  }
} 