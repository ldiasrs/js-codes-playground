'use client';

import React from 'react';
import { AuthLayout } from '../../../components/auth/AuthLayout';
import { RegisterForm } from '../../../components/auth/RegisterForm';
import { AuthGuard } from '../../../components/auth/AuthGuard';

export default function RegisterPage() {
  return (
    <AuthGuard requireAuth={false}>
      <AuthLayout
        title="Create Account"
        subtitle="Join us and start your learning journey"
      >
        <RegisterForm />
      </AuthLayout>
    </AuthGuard>
  );
} 