import jwt from 'jsonwebtoken';
import { Customer } from '../../domain/Customer';
import { CustomerRepositoryPort } from '../ports/CustomerRepositoryPort';
import { AuthenticationAttemptRepositoryPort } from '../ports/AuthenticationAttemptRepositoryPort';
import { LoggerPort } from '../../../../shared/ports/LoggerPort';
import { JwtConfiguration } from '../../../../infrastructure/config/jwt.config';

export interface VerifyAuthCodeFeatureData {
  customerId: string;
  verificationCode: string;
}

export interface VerifyAuthCodeFeatureResult {
  success: boolean;
  message: string;
  customerId?: string;
  token?: string;
}



export class VerifyAuthCodeFeature {
  constructor(
    private readonly customerRepository: CustomerRepositoryPort,
    private readonly authenticationAttemptRepository: AuthenticationAttemptRepositoryPort,
    private readonly logger: LoggerPort,
    private readonly jwtConfiguration: JwtConfiguration = JwtConfiguration.getInstance()
  ) {}

  /**
   * Verifies a customer's authentication code
   * @param data The data containing the customer's email and verification code
   * @returns Promise<VerifyCustomerFeatureResult> The verification result
   * @throws Error if verification process fails
   */
  async execute(data: VerifyAuthCodeFeatureData): Promise<VerifyAuthCodeFeatureResult> {
    const { customerId, verificationCode } = data;

  

    // Step 2: Validate verification code format
    if (!this.isValidVerificationCode(verificationCode)) {
      return {
        success: false,
        message: 'Please enter a valid 6-digit verification code'
      };
    }

    // Step 3: Find customer by email
    const customer = await this.customerRepository.findById(customerId);
    if (!customer) {
      return {
        success: false,
        message: 'No account found with this customerId'
      };
    }

    // Step 4: Find the latest valid authentication attempt
    const authenticationAttempt = await this.authenticationAttemptRepository.findLatestValidByCustomerId(customer.id!);
    if (!authenticationAttempt) {
      return {
        success: false,
        message: 'No valid verification code found. Please request a new code.'
      };
    }

    // Step 5: Check if the authentication attempt has expired
    if (authenticationAttempt.isExpired()) {
      return {
        success: false,
        message: 'Verification code has expired. Please request a new code.'
      };
    }

    // Step 6: Check if the authentication attempt has already been used
    if (authenticationAttempt.isUsed) {
      return {
        success: false,
        message: 'Verification code has already been used. Please request a new code.'
      };
    }

    // Step 7: Verify the code matches
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

    // Step 8: Mark the authentication attempt as used
    const updatedAttempt = authenticationAttempt.markAsUsed();
    await this.authenticationAttemptRepository.update(updatedAttempt);

    // Step 9: Generate a simple token (in a real app, you'd use JWT)
    const token = this.generateToken(customer);

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

  /**
   * Validates email format using regex
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validates verification code format (6 digits)
   */
  private isValidVerificationCode(code: string): boolean {
    const codeRegex = /^\d{6}$/;
    return codeRegex.test(code);
  }

  /**
   * Generates a JWT authentication token with proper signing
   */
  private generateToken(customer: Customer): string {
    const jwtConfig = this.jwtConfiguration.getConfig();
    
    const payload = {
      sub: customer.id?.toString() || '',
      customerId: customer.id?.toString() || ''
    };
    
    return jwt.sign(
      payload, 
      jwtConfig.secret, 
      {
        issuer: jwtConfig.issuer,
        algorithm: jwtConfig.algorithm
      }
    );
  }
} 