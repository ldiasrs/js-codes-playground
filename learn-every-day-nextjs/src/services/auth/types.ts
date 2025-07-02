export interface LoginRequest {
  email: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  customerId?: string;
}

export interface VerifyCodeRequest {
  customerId: string;
  code: string;
}

export interface VerifyCodeResponse {
  success: boolean;
  message: string;
  customerId: string;
  token?: string;
}


export interface LoginAuthState {
  isAuthenticated: boolean;
  customerId: string | null;
  isLoading: boolean;
} 