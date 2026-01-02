import { CustomerRepositoryPort } from '../ports/CustomerRepositoryPort';
import { AuthenticationAttemptRepositoryPort } from '../ports/AuthenticationAttemptRepositoryPort';
import { TokenGenerationService } from './TokenGenerationService';
import { LoggerPort } from '../../../../shared/ports/LoggerPort';
import { VerificationCodeValidator } from '../../domain/VerificationCodeValidator';

export interface VerificationResult {
  success: boolean;
  message: string;
  customerId?: string;
  token?: string;
}

/**
 * Application service for verifying authentication codes.
 * Orchestrates the verification flow including code validation, attempt validation, and token generation.
 */
export class AuthenticationVerificationService {
  constructor(
    private readonly customerRepository: CustomerRepositoryPort,
    private readonly authenticationAttemptRepository: AuthenticationAttemptRepositoryPort,
    private readonly tokenGenerationService: TokenGenerationService,
    private readonly logger: LoggerPort
  ) {}

  /**
   * Verifies a customer's authentication code and generates a token if successful.
   * @param customerId The customer ID
   * @param verificationCode The verification code to verify
   * @returns Promise<VerificationResult> The verification result
   */
  async verifyCode(customerId: string, verificationCode: string): Promise<VerificationResult> {
    VerificationCodeValidator.validateFormat(verificationCode);

    const customer = await this.customerRepository.findById(customerId);
    if (!customer) {
      return {
        success: false,
        message: 'No account found with this customerId'
      };
    }

    const authenticationAttempt = await this.authenticationAttemptRepository.findLatestValidByCustomerId(customer.id!);
    if (!authenticationAttempt) {
      return {
        success: false,
        message: 'No valid verification code found. Please request a new code.'
      };
    }

    if (authenticationAttempt.isExpired()) {
      return {
        success: false,
        message: 'Verification code has expired. Please request a new code.'
      };
    }

    if (authenticationAttempt.isUsed) {
      return {
        success: false,
        message: 'Verification code has already been used. Please request a new code.'
      };
    }

    if (authenticationAttempt.encryptedVerificationCode !== verificationCode) {
      this.logger.warn('Invalid verification code attempt', {
        customerId: customer.id,
        providedCode: verificationCode
      });

      return {
        success: false,
        message: 'Invalid verification code. Please check your code and try again.'
      };
    }

    const updatedAttempt = authenticationAttempt.markAsUsed();
    await this.authenticationAttemptRepository.update(updatedAttempt);

    const token = this.tokenGenerationService.generateToken(customer);

    this.logger.info('Customer verification successful', {
      customerId: customer.id,
    });

    return {
      success: true,
      message: 'Verification successful. Welcome back!',
      customerId: customer.id || '',
      token
    };
  }
}

