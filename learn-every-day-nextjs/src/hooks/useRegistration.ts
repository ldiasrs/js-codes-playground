import { useState } from 'react';
import { CreateCustomerFeatureData } from '../learneveryday/features/auth/application/use-cases/CreateCustomerFeature';

interface RegistrationResult {
  success: boolean;
  message: string;
  customerId?: string;
}

export const useRegistration = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const register = async (data: CreateCustomerFeatureData): Promise<RegistrationResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Registration failed');
      }

      return {
        success: true,
        message: result.message || 'Registration successful',
        customerId: result.customerId,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      setError(errorMessage);
      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    register,
    isLoading,
    error,
    clearError: () => setError(null),
  };
}; 