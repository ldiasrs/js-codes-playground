import { AuthService } from './AuthService';
import { LoginRequest, LoginResponse, VerifyCodeRequest, VerifyCodeResponse } from './types';

export class RealAuthService implements AuthService {
  /**
   * Initiates the login process by sending a verification code to the provided email
   */
  async login(request: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: request.email }),
        credentials: 'include', // Include cookies in request
      });

      const result = await response.json();

      if (result.success) {
        // Store email for verification (needed for the verification step)
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('pendingEmail', request.email);
        }

        return {
          success: true,
          message: result.message,
          requiresVerification: true,
        };
      } else {
        return {
          success: false,
          message: result.message,
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'An error occurred during login. Please try again.',
      };
    }
  }

  /**
   * Verifies the provided code and completes the authentication process
   */
  async verifyCode(request: VerifyCodeRequest): Promise<VerifyCodeResponse> {
    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: request.email, 
          verificationCode: request.code 
        }),
        credentials: 'include', // Include cookies in request
      });

      const result = await response.json();

      if (result.success && result.customerId) {
        // Store only customerId in sessionStorage
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('customerId', result.customerId);
          // Clear the pending email since verification is complete
          sessionStorage.removeItem('pendingEmail');
        }

        return {
          success: true,
          message: result.message,
          customerId: result.customerId,
        };
      } else {
        return {
          success: false,
          message: result.message,
          customerId: '',
        };
      }
    } catch (error) {
      console.error('Verification error:', error);
      return {
        success: false,
        customerId: '',
          message: 'An error occurred during verification. Please try again.',
      };
    }
  }

  /**
   * Logs out the current user by calling the logout endpoint and clearing session storage
   */
  async logout(): Promise<void> {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include', // Include cookies in request
      });
      
      // Clear session storage data
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('customerId');
        sessionStorage.removeItem('pendingEmail');
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear session data even if API call fails
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('customerId');
        sessionStorage.removeItem('pendingEmail');
      }
    }
  }
} 