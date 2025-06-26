import React from 'react';
import { AuthLayout } from '../../../components/auth/AuthLayout';
import { LoginForm } from '../../../components/auth/LoginForm';

export default function LoginPage() {
  return (
    <AuthLayout
      title="Sign In"
      subtitle="Enter your email address to continue"
    >
      <LoginForm />
    </AuthLayout>
  );
} 