import { useState } from 'react';
import { CreateCustomerCommandData } from '../learneveryday/application/commands/customer/CreateCustomerCommand';
import { CustomerDTO } from '../learneveryday/application/dto/CustomerDTO';

interface RegistrationResult {
  success: boolean;
  message: string;
  customer?: CustomerDTO;
}

export const useRegistration = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const register = async (data: CreateCustomerCommandData): Promise<RegistrationResult> => {
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
        customer: result.customer,
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