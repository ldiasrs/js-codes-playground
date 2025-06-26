import React from 'react';
import { AuthLayout } from '../../../components/auth/AuthLayout';
import { VerificationForm } from '../../../components/auth/VerificationForm';

export default function VerifyPage() {
  return (
    <AuthLayout
      title="Verify Your Email"
      subtitle="Enter the verification code sent to your email"
    >
      <VerificationForm />
    </AuthLayout>
  );
} 