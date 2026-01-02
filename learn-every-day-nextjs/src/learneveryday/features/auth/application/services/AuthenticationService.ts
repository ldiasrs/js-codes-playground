import { CustomerRepositoryPort } from '../ports/CustomerRepositoryPort';
import { SendVerificationCodePort } from '../ports/SendVerificationCodePort';
import { AuthenticationAttemptRepositoryPort } from '../ports/AuthenticationAttemptRepositoryPort';
import { AuthenticationAttempt } from '../../domain/AuthenticationAttempt';
import { VerificationCodeGenerator } from '../../domain/VerificationCodeGenerator';
import { EmailValidationService } from './EmailValidationService';
import { LoggerPort } from '../../../../shared/ports/LoggerPort';

export interface AuthenticationResult {
  success: boolean;
  message: string;
  customerId?: string;
}

/**
 * Application service for authentication operations.
 * Orchestrates the login flow including email validation, code generation, and sending.
 */
export class AuthenticationService {
  constructor(
    private readonly customerRepository: CustomerRepositoryPort,
    private readonly sendVerificationCodePort: SendVerificationCodePort,
    private readonly authenticationAttemptRepository: AuthenticationAttemptRepositoryPort,
    private readonly emailValidationService: EmailValidationService,
    private readonly logger: LoggerPort
  ) {}

  /**
   * Initiates the authentication process by sending a verification code.
   * @param email The customer's email address
   * @returns Promise<AuthenticationResult> The authentication result
   */
  async initiateAuthentication(email: string): Promise<AuthenticationResult> {
    this.emailValidationService.validateEmailFormat(email);

    const customer = await this.customerRepository.findByEmail(email);
    if (!customer) {
      return {
        success: false,
        message: 'No account found with this email address. Please check your email or create a new account.'
      };
    }

    const verificationCode = VerificationCodeGenerator.generate();

    try {
      await this.sendVerificationCodePort.send({
        email: customer.email,
        customerName: customer.customerName,
        verificationCode,
        customerId: customer.id || "not-provided"
      });

      const authenticationAttempt = AuthenticationAttempt.createForCustomer(
        customer.id!,
        verificationCode
      );

      await this.authenticationAttemptRepository.save(authenticationAttempt);

      this.logger.info(`Verification code sent to customer ${customer.id}`, {
        customerId: customer.id,
        customerEmail: customer.email,
        verificationCode
      });

      return {
        success: true,
        message: `Verification code sent to ${customer.email}`,
        customerId: customer.id
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
}

