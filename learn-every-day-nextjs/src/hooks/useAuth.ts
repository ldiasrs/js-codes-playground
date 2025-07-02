'use client';

import { useState, useEffect, useCallback } from 'react';
import { LoginAuthState } from '../services/auth/types';
import { LoginAuthService } from '../services/auth/LoginAuthService';

const authService = new LoginAuthService();

export const useAuth = () => {
  const [authState, setAuthState] = useState<LoginAuthState>({
    isAuthenticated: false,
    customerId: null,
    isLoading: true,
  });


  // Initialize auth state from sessionStorage on mount
  useEffect(() => {
    const initializeAuth = () => {
      if (typeof window !== 'undefined') {
        const customerId = sessionStorage.getItem('customerId');

        if (customerId) {
          // Create a minimal user object with just the customerId
          setAuthState({
            isAuthenticated: true,
            customerId: customerId,
            isLoading: false,
          });
        } else {
          setAuthState({
            isAuthenticated: false,
            customerId: null,
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
        // Store customerId and email in sessionStorage immediately after successful login
        if (typeof window !== 'undefined' && response.customerId) {
          console.log('🚨 login: setting customerId', response.customerId);
          sessionStorage.setItem('customerId', response.customerId);
        }
        
        //setAuthState(prev => ({ ...prev, customerId: response.customerId ?? null, requireAuth: true, isAuthenticated: true }));
        return { success: true, message: response.message};
      } else {
        return { success: false, message: response.message };
      }
    } catch {
      return { success: false, message: 'An error occurred during login' };
    } finally {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const verifyCode = useCallback(async (customerId: string, code: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await authService.verifyCode({ customerId, code });
      
      console.log('verifyCode response', response);
      if (response.success && response.customerId) {
    

        setAuthState({
          isAuthenticated: true,
          customerId: response.customerId,
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
        customerId: null,
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