'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useAuth } from '../../hooks/useAuth';

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const { login, isLoading } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    const result = await login(email);
    
    if (result.success) {
      setSuccessMessage(result.message);
      router.push('/auth/verify');
    } else {
      setError(result.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        type="email"
        label="Email Address"
        placeholder="Enter your email address"
        value={email}
        onChange={setEmail}
        error={error}
        required
        autoComplete="email"
        disabled={isLoading}
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
        Continue
      </Button>

      <div className="text-center pt-4">
        <p className="text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <button
            type="button"
            className="text-primary hover:text-primary/80 font-medium transition-colors duration-200 underline underline-offset-2"
            onClick={() => router.push('/auth/register')}
          >
            Register here
          </button>
        </p>
      </div>
    </form>
  );
}; 