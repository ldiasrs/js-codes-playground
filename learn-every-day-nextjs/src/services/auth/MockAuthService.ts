import { AuthService } from './AuthService';
import { LoginRequest, LoginResponse, VerifyCodeRequest, VerifyCodeResponse, UserData } from './types';

export class MockAuthService implements AuthService {
  private readonly mockVerificationCode = '123456';
  private readonly mockUserData: UserData = {
    id: '1',
    email: 'user@example.com',
    name: 'John Doe',
    createdAt: new Date().toISOString(),
  };

  /**
   * Simulates sending a verification code to the provided email
   */
  async login(request: LoginRequest): Promise<LoginResponse> {
    // Simulate API delay
    await this.delay(2000);

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(request.email)) {
      return {
        success: false,
        message: 'Please enter a valid email address',
      };
    }

    // Store email for verification (in a real app, this would be in a database)
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('pendingEmail', request.email);
    }

    return {
      success: true,
      message: `Verification code sent to ${request.email}`,
      requiresVerification: true,
    };
  }

  /**
   * Verifies the provided code and returns user data if successful
   */
  async verifyCode(request: VerifyCodeRequest): Promise<VerifyCodeResponse> {
    // Simulate API delay
    await this.delay(1500);

    // Check if the code matches
    if (request.code !== this.mockVerificationCode) {
      return {
        success: false,
        message: 'Invalid verification code. Please try again.',
      };
    }

    // Generate a mock token
    const mockToken = `mock_token_${Date.now()}`;

    // Create user data with the actual email
    const userData: UserData = {
      ...this.mockUserData,
      email: request.email,
    };

    return {
      success: true,
      message: 'Login successful!',
      user: userData,
      token: mockToken,
    };
  }

  /**
   * Logs out the current user
   */
  async logout(): Promise<void> {
    // Simulate API delay
    await this.delay(500);

    // Clear stored data
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('pendingEmail');
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
    }
  }

  /**
   * Helper method to simulate API delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
} 