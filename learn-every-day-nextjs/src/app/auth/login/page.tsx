'use client';

import React from 'react';
import { AuthLayout } from '../../../components/auth/AuthLayout';
import { LoginForm } from '../../../components/auth/LoginForm';
import { AuthGuard } from '../../../components/auth/AuthGuard';

export default function LoginPage() {
  return (
    <AuthGuard requireAuth={false}>
      <AuthLayout
        title="Sign In"
        subtitle="Enter your email address to continue"
      >
        <LoginForm />
      </AuthLayout>
    </AuthGuard>
  );
} 