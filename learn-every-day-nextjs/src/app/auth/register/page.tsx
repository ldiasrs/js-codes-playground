'use client';

import React from 'react';
import { AuthLayout } from '../../../components/auth/AuthLayout';
import { RegisterForm } from '../../../components/auth/RegisterForm';

export default function RegisterPage() {
  return (
    <AuthLayout
      title="Create Account"
      subtitle="Join us and start your learning journey"
    >
      <RegisterForm />
    </AuthLayout>
  );
} 