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


  // Initialize auth state from token validation on mount
  useEffect(() => {
    const initializeAuth = async () => {
      if (typeof window !== 'undefined') {
        try {
          // First check if we have a customerId in sessionStorage for basic state
          const customerId = sessionStorage.getItem('customerId');
          console.log('🔍 Auth initialization - customerId from sessionStorage:', customerId);
          
          if (customerId) {
            // We have a customerId, but we need to validate the token
            console.log('🔍 Auth initialization - validating token...');
            const validationResult = await authService.validateToken();
            console.log('🔍 Auth initialization - validation result:', validationResult);
            
            if (validationResult.success && validationResult.isAuthenticated) {
              // Token is valid, user is authenticated
              console.log('✅ Auth initialization - token is valid, user authenticated');
              setAuthState({
                isAuthenticated: true,
                customerId: validationResult.customerId || customerId,
                isLoading: false,
              });
            } else {
              // Token is invalid or expired, clear session data
              console.log('❌ Auth initialization - token invalid/expired, clearing session');
              sessionStorage.removeItem('customerId');
              setAuthState({
                isAuthenticated: false,
                customerId: null,
                isLoading: false,
              });
            }
          } else {
            // No customerId in sessionStorage, user is not authenticated
            console.log('❌ Auth initialization - no customerId, user not authenticated');
            setAuthState({
              isAuthenticated: false,
              customerId: null,
              isLoading: false,
            });
          }
        } catch (error) {
          console.error('🚨 Auth initialization error:', error);
          // Clear session data on error
          sessionStorage.removeItem('customerId');
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
      
      // Clear sessionStorage
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('customerId');
      }
      
      setAuthState({
        isAuthenticated: false,
        customerId: null,
        isLoading: false,
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear session data even if API call fails
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('customerId');
      }
      setAuthState({
        isAuthenticated: false,
        customerId: null,
        isLoading: false,
      });
    }
  }, []);

  return {
    ...authState,
    login,
    verifyCode,
    logout,
  };
}; 