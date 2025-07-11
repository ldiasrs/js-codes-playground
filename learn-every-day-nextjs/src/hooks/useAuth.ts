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
  // The middleware handles the real authentication - this is just for UI state
  useEffect(() => {
    const initializeAuth = async () => {
      if (typeof window !== 'undefined') {
        const customerId = sessionStorage.getItem('customerId');
        console.log('🔍 Auth initialization - customerId from sessionStorage:', customerId);
        
        if (customerId) {
          // If we have a customerId, assume user is authenticated
          // The middleware will handle the actual token validation and redirect if needed
          console.log('✅ Auth initialization - customerId found, user appears authenticated');
          setAuthState({
            isAuthenticated: true,
            customerId: customerId,
            isLoading: false,
          });
        } else {
          // No customerId in sessionStorage, but user might still be authenticated
          // Check if we can access a protected endpoint to detect server-side authentication
          console.log('🔍 Auth initialization - no customerId, checking server-side auth...');
          
          try {
            const response = await fetch('/api/auth/me', {
              method: 'GET',
              credentials: 'include',
            });
            
            if (response.ok) {
              const userData = await response.json();
              if (userData.success && userData.customerId) {
                // User is authenticated server-side, sync client-side state
                console.log('✅ Auth initialization - server-side auth detected, syncing client state');
                console.log('🔍 Auth initialization - customerId from server:', userData.customerId);
                
                // Store customerId in sessionStorage for future use
                sessionStorage.setItem('customerId', userData.customerId);
                
                setAuthState({
                  isAuthenticated: true,
                  customerId: userData.customerId,
                  isLoading: false,
                });
              } else {
                console.log('❌ Auth initialization - server response invalid, user not authenticated');
                setAuthState({
                  isAuthenticated: false,
                  customerId: null,
                  isLoading: false,
                });
              }
            } else {
              // User cannot access protected endpoint, they're not authenticated
              console.log('❌ Auth initialization - server-side auth not detected, user not authenticated');
              setAuthState({
                isAuthenticated: false,
                customerId: null,
                isLoading: false,
              });
            }
          } catch (error) {
            console.error('🚨 Auth initialization - error checking server-side auth:', error);
            setAuthState({
              isAuthenticated: false,
              customerId: null,
              isLoading: false,
            });
          }
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
        // Store customerId in sessionStorage immediately after successful login
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
        // Update auth state - the JWT cookie is set by the server
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