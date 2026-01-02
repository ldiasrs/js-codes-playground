import { AuthenticationVerificationService } from '../services/AuthenticationVerificationService';

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
    private readonly authenticationVerificationService: AuthenticationVerificationService
  ) {}

  /**
   * Verifies a customer's authentication code
   * @param data The data containing the customer's email and verification code
   * @returns Promise<VerifyCustomerFeatureResult> The verification result
   * @throws Error if verification process fails
   */
  async execute(data: VerifyAuthCodeFeatureData): Promise<VerifyAuthCodeFeatureResult> {
    const { customerId, verificationCode } = data;
    return await this.authenticationVerificationService.verifyCode(customerId, verificationCode);
  }
} 