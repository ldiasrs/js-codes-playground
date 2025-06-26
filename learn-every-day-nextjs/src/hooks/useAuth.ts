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

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const initializeAuth = () => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('authToken');
        const userData = localStorage.getItem('userData');

        if (token && userData) {
          try {
            const user = JSON.parse(userData) as UserData;
            setAuthState({
              isAuthenticated: true,
              user,
              token,
              isLoading: false,
            });
          } catch {
            // Invalid stored data, clear it
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
            setAuthState({
              isAuthenticated: false,
              user: null,
              token: null,
              isLoading: false,
            });
          }
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
      
      if (response.success && response.user && response.token) {
        // Store auth data
        if (typeof window !== 'undefined') {
          localStorage.setItem('authToken', response.token);
          localStorage.setItem('userData', JSON.stringify(response.user));
        }

        setAuthState({
          isAuthenticated: true,
          user: response.user,
          token: response.token,
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