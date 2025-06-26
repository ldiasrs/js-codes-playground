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
  const { verifyCode, isLoading } = useAuth();
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
      // Navigate to dashboard after a short delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } else {
      setError(result.message);
    }
  };

  const handleResendCode = async () => {
    setError('');
    // In a real implementation, this would call the login service again
    setSuccessMessage('Verification code resent to your email');
  };

  if (!email) {
    return (
      <div className="text-center">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center mb-4">
        <p className="text-gray-600">
          We&apos;ve sent a verification code to:
        </p>
        <p className="font-medium text-gray-900">{email}</p>
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
        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-800 text-sm">{successMessage}</p>
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

      <div className="text-center space-y-2">
        <p className="text-sm text-gray-600">
          Didn&apos;t receive the code?{' '}
          <button
            type="button"
            className="text-blue-600 hover:text-blue-700 font-medium"
            onClick={handleResendCode}
            disabled={isLoading}
          >
            Resend
          </button>
        </p>
        <p className="text-sm text-gray-600">
          <button
            type="button"
            className="text-blue-600 hover:text-blue-700 font-medium"
            onClick={() => router.push('/auth/login')}
          >
            Back to login
          </button>
        </p>
      </div>
    </form>
  );
}; 