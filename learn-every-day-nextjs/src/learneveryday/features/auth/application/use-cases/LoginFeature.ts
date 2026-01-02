import { AuthenticationService } from '../services/AuthenticationService';

export interface LoginFeatureData {
  email: string;
}

export interface LoginFeatureResponse {
  success: boolean;
  message: string;
  customerId?: string;
}

export class LoginFeature {
  constructor(
    private readonly authenticationService: AuthenticationService
  ) {}

  /**
   * Authenticates a customer by email and sends a verification code
   * @param data The data containing the customer's email
   * @throws Error if authentication process fails
   */
  async execute(data: LoginFeatureData): Promise<LoginFeatureResponse> {
    const { email } = data;
    return await this.authenticationService.initiateAuthentication(email);
  }
} 