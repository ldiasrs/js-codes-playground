import { Customer } from '../entities/Customer';
import { CustomerRepositoryPort } from '../ports/CustomerRepositoryPort';
import { SendVerificationCodePort } from '../ports/SendVerificationCodePort';
import { LoggerPort } from '../../shared/ports/LoggerPort';

export interface AuthCustomerFeatureData {
  email: string;
}

export interface AuthCustomerFeatureResult {
  success: boolean;
  message: string;
  customer?: Customer;
  verificationCode?: string;
}

export class AuthCustomerFeature {
  constructor(
    private readonly customerRepository: CustomerRepositoryPort,
    private readonly sendVerificationCodePort: SendVerificationCodePort,
    private readonly logger: LoggerPort
  ) {}

  /**
   * Authenticates a customer by email and sends a verification code
   * @param data The data containing the customer's email
   * @returns Promise<AuthCustomerFeatureResult> The authentication result
   * @throws Error if authentication process fails
   */
  async execute(data: AuthCustomerFeatureData): Promise<AuthCustomerFeatureResult> {
    const { email } = data;

    // Step 1: Validate email format
    if (!this.isValidEmail(email)) {
      return {
        success: false,
        message: 'Please enter a valid email address'
      };
    }

    // Step 2: Find customer by email
    const customer = await this.customerRepository.findByEmail(email);
    if (!customer) {
      return {
        success: false,
        message: 'No account found with this email address. Please check your email or create a new account.'
      };
    }

    // Step 3: Generate verification code
    const verificationCode = this.generateVerificationCode();

    // Step 4: Send verification code via email
    try {
      await this.sendVerificationCodePort.send({
        email: customer.email,
        customerName: customer.customerName,
        verificationCode
      });

      this.logger.info(`Verification code sent to customer ${customer.id}`, {
        customerId: customer.id,
        customerEmail: customer.email,
        verificationCode
      });

      return {
        success: true,
        message: `Verification code sent to ${customer.email}`,
        customer,
        verificationCode
      };
    } catch (error) {
      this.logger.error('Error sending verification code', error as Error, {
        customerId: customer.id,
        customerEmail: customer.email
      });

      return {
        success: false,
        message: 'Failed to send verification code. Please try again later.'
      };
    }
  }

  /**
   * Validates email format using regex
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Generates a random 6-digit verification code
   */
  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
} 