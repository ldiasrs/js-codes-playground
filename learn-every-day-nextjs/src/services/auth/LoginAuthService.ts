import { LoginRequest, LoginResponse, VerifyCodeRequest, VerifyCodeResponse } from './types';

export class LoginAuthService  {
  /**
   * Validates the current JWT token and returns authentication state
   */
  async validateToken(): Promise<{ success: boolean; isAuthenticated: boolean; customerId?: string; message: string }> {
    try {
      const response = await fetch('/api/auth/validate', {
        method: 'GET',
        credentials: 'include', // Include cookies in request
      });

      const result = await response.json();

      if (result.success && result.isAuthenticated) {
        return {
          success: true,
          isAuthenticated: true,
          customerId: result.customerId,
          message: result.message,
        };
      } else {
        return {
          success: false,
          isAuthenticated: false,
          message: result.message,
        };
      }
    } catch (error) {
      console.error('Token validation error:', error);
      return {
        success: false,
        isAuthenticated: false,
        message: 'Unable to validate token',
      };
    }
  }

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
        return {
          success: true,
          message: result.message,
          customerId: result.customerId,
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

      console.log('🚨 verifyCode customerId', request);
      const customerId = request?.customerId || this.getCustomerId();

      
      if (!customerId) {
        return {
          success: false,
          customerId: '',
          message: 'Customer ID is required. Please log in again.',
        };
      }


      const response = await fetch(`/api/auth/verify?customerId=${encodeURIComponent(customerId)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          verificationCode: request.code 
        }),
        credentials: 'include', // Include cookies in request
      });

      const result = await response.json();

      if (result.success && result.customerId) {
        // Token is automatically stored in HTTP-only cookie by the server
        // No need to store in sessionStorage for security reasons

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
        // authToken is cleared via HTTP-only cookie by the server
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear session data even if API call fails
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('customerId');
        // authToken is managed via HTTP-only cookie by the server
      }
    }
  }
  private getCustomerId(): string | null {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('customerId');
    }
    return null;
  }
} 