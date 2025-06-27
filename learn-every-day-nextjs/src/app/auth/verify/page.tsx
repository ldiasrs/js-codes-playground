'use client';

import React from 'react';
import { AuthLayout } from '../../../components/auth/AuthLayout';
import { VerificationForm } from '../../../components/auth/VerificationForm';
import { AuthGuard } from '../../../components/auth/AuthGuard';

export default function VerifyPage() {
  return (
    <AuthGuard requireAuth={false}>
      <AuthLayout
        title="Verify Your Email"
        subtitle="Enter the verification code sent to your email"
      >
        <VerificationForm />
      </AuthLayout>
    </AuthGuard>
  );
} 