'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useAuth } from '../../hooks/useAuth';

export const VerificationForm: React.FC = () => {
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isResending, setIsResending] = useState(false);
  const { verifyCode, login, isLoading } = useAuth();
  const router = useRouter();

  // Get email from sessionStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedEmail = sessionStorage.getItem('pendingEmail');
      if (storedEmail) {
        setEmail(storedEmail);
      } else {
        // No email found, redirect back to login
        router.push('/auth/login');
      }
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

    if (!email) {
      setError('Email not found. Please try logging in again.');
      return;
    }

    const result = await verifyCode(email, code);
    
    if (result.success) {
      setSuccessMessage(result.message);
      // Navigate to topics page after a short delay
      setTimeout(() => {
        router.push('/topics');
      }, 1500);
    } else {
      setError(result.message);
    }
  };

  const handleResendCode = async () => {
    setError('');
    setSuccessMessage('');
    setIsResending(true);

    try {
      const result = await login(email);
      
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

  if (!email) {
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
          We&apos;ve sent a verification code to:
        </p>
        <p className="font-medium text-foreground mt-1">{email}</p>
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
        disabled={isLoading}
        maxLength={6}
      />

      {successMessage && (
        <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
          <p className="text-primary text-sm font-medium">{successMessage}</p>
        </div>
      )}

      <Button
        type="submit"
        loading={isLoading}
        disabled={isLoading}
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
            disabled={isLoading || isResending}
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