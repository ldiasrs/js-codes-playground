import { LoginRequest, LoginResponse, VerifyCodeRequest, VerifyCodeResponse } from './types';

export interface AuthService {
  /**
   * Initiates the login process by sending a verification code to the provided email
   */
  login(request: LoginRequest): Promise<LoginResponse>;

  /**
   * Verifies the provided code and completes the authentication process
   */
  verifyCode(request: VerifyCodeRequest): Promise<VerifyCodeResponse>;

  /**
   * Logs out the current user
   */
  logout(): Promise<void>;
} 