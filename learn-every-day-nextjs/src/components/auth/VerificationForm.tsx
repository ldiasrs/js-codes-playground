'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useAuth } from '../../hooks/useAuth';

export const VerificationForm: React.FC = () => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { verifyCode, login, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // Get customerId from sessionStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedCustomerId = sessionStorage.getItem('customerId');
      console.log('VerificationForm customerId', storedCustomerId);
      
      if (!storedCustomerId) {
        console.log('🚨 VerificationForm customerId not found, redirecting to login');
        router.push('/auth/login');
      } else {
        setCustomerId(storedCustomerId);
      }
      setIsLoading(false);
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    if (!code.trim()) {
      setError('Please enter the verification code');
      return;
    }

    
    if (!customerId) {
      setError('Session expired. Please try logging in again.');
      return;
    }

    console.log('🚨 VerificationForm: customerId', customerId);
    const result = await verifyCode(customerId, code);
    
    if (result.success) {
      setSuccessMessage(result.message);
      
      // Check for redirect URL in sessionStorage
      const redirectUrl = typeof window !== 'undefined' 
        ? sessionStorage.getItem('authRedirect') 
        : null;
      
      if (redirectUrl) {
        // Clear the redirect URL from sessionStorage after using it
        sessionStorage.removeItem('authRedirect');
        router.push(redirectUrl);
      } else {
        // Default to topics page if no redirect URL
        router.push('/topics');
      }
    } else {
      setError(result.message);
    }
  };

  const handleResendCode = async () => {
    setError('');
    setSuccessMessage('');
    setIsResending(true);
    try {
      if (!customerId) {
        setError('Email not found. Please try logging in again.');
        return;
      }
      
      const result = await login(customerId);
      
      if (result.success) {
        setSuccessMessage('Verification code resent to your email');
      } else {
        setError(result.message);
      }
    } catch (error) {
      console.error('Resend error:', error);
      setError('Failed to resend verification code. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  if (isLoading || !customerId) {
    return (
      <div className="text-center">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-6">
        <p className="text-muted-foreground">
          We&apos;ve sent a verification code to your email
        </p>
      </div>

      <Input
        type="text"
        label="Verification Code"
        placeholder="Enter 6-digit code"
        value={code}
        onChange={setCode}
        error={error}
        required
        autoComplete="one-time-code"
        disabled={authLoading}
        maxLength={6}
      />

      {successMessage && (
        <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
          <p className="text-primary text-sm font-medium">{successMessage}</p>
        </div>
      )}

      <Button
        type="submit"
        loading={authLoading}
        disabled={authLoading}
        className="w-full"
      >
        Verify Code
      </Button>

      <div className="text-center space-y-3 pt-4">
        <p className="text-sm text-muted-foreground">
          Didn&apos;t receive the code?{' '}
          <button
            type="button"
            className="text-primary hover:text-primary/80 font-medium transition-colors duration-200 underline underline-offset-2"
            onClick={handleResendCode}
            disabled={authLoading || isResending}
          >
            {isResending ? 'Resending...' : 'Resend'}
          </button>
        </p>
        <p className="text-sm text-muted-foreground">
          <button
            type="button"
            className="text-primary hover:text-primary/80 font-medium transition-colors duration-200 underline underline-offset-2"
            onClick={() => router.push('/auth/login')}
          >
            Back to login
          </button>
        </p>
      </div>
    </form>
  );
}; 