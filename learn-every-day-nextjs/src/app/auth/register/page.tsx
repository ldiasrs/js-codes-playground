'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AuthLayout } from '../../../components/auth/AuthLayout';
import { Button } from '../../../components/ui/Button';

export default function RegisterPage() {
  const router = useRouter();

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Registration is coming soon!"
    >
      <div className="space-y-4">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-blue-800 text-sm">
            Registration functionality is currently under development. 
            For now, please use the sign-in option to access your account.
          </p>
        </div>
        
        <Button
          onClick={() => router.push('/auth/login')}
          className="w-full"
        >
          Go to Sign In
        </Button>

        <div className="text-center">
          <button
            type="button"
            className="text-blue-600 hover:text-blue-700 font-medium"
            onClick={() => router.push('/lending')}
          >
            Back to Home
          </button>
        </div>
      </div>
    </AuthLayout>
  );
} 