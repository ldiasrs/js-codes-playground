'use client';

import { useState, useEffect, useCallback } from 'react';
import { AuthState, UserData } from '../services/auth/types';
import { RealAuthService } from '../services/auth/RealAuthService';

const authService = new RealAuthService();

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
    isLoading: true,
  });

  // Initialize auth state from sessionStorage on mount
  useEffect(() => {
    const initializeAuth = () => {
      if (typeof window !== 'undefined') {
        const customerId = sessionStorage.getItem('customerId');

        if (customerId) {
          // Create a minimal user object with just the customerId
          const user: UserData = {
            id: customerId,
            email: '', // We don't store email in session anymore
            name: '', // We don't store name in session anymore
            createdAt: '', // We don't store createdAt in session anymore
          };

          setAuthState({
            isAuthenticated: true,
            user,
            token: null, // We don't store token anymore
            isLoading: false,
          });
        } else {
          setAuthState({
            isAuthenticated: false,
            user: null,
            token: null,
            isLoading: false,
          });
        }
      }
    };

    initializeAuth();
  }, []);

  const login = useCallback(async (email: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await authService.login({ email });
      
      if (response.success) {
        return { success: true, message: response.message };
      } else {
        return { success: false, message: response.message };
      }
    } catch {
      return { success: false, message: 'An error occurred during login' };
    } finally {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const verifyCode = useCallback(async (email: string, code: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await authService.verifyCode({ email, code });
      
      if (response.success && response.customerId) {
        // Create user object from response

        setAuthState({
          isAuthenticated: true,
          user,
          token: null, // We don't use tokens in state anymore
          isLoading: false,
        });

        return { success: true, message: response.message };
      } else {
        return { success: false, message: response.message };
      }
    } catch {
      return { success: false, message: 'An error occurred during verification' };
    } finally {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const logout = useCallback(async () => {
    setAuthState(prev => ({ ...prev, isLoading: true }));

    try {
      await authService.logout();
      
      setAuthState({
        isAuthenticated: false,
        user: null,
        token: null,
        isLoading: false,
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  return {
    ...authState,
    login,
    verifyCode,
    logout,
  };
}; 