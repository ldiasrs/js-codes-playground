'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useRegistration } from '../../hooks/useRegistration';
import { 
  validateEmail, 
  validatePhoneNumber, 
  validateRequired, 
  validateCustomerName,
  validateGovIdentification 
} from '../../common/validator';

interface FormData {
  customerName: string;
  govIdentificationType: string;
  govIdentificationContent: string;
  email: string;
  phoneNumber: string;
}

interface FormErrors {
  customerName?: string;
  govIdentificationType?: string;
  govIdentificationContent?: string;
  email?: string;
  phoneNumber?: string;
}

export const RegisterForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    customerName: '',
    govIdentificationType: 'CPF',
    govIdentificationContent: '',
    email: '',
    phoneNumber: ''
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState('');
  const { register, isLoading, error } = useRegistration();
  const router = useRouter();

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validate customer name
    if (!validateRequired(formData.customerName)) {
      newErrors.customerName = 'Customer name is required';
    } else if (!validateCustomerName(formData.customerName)) {
      newErrors.customerName = 'Customer name must be between 2 and 100 characters';
    }

    // Validate government identification type
    if (!formData.govIdentificationType) {
      newErrors.govIdentificationType = 'Identification type is required';
    }

    // Validate government identification content
    if (!validateRequired(formData.govIdentificationContent)) {
      newErrors.govIdentificationContent = 'Identification content is required';
    } else if (!validateGovIdentification(formData.govIdentificationType, formData.govIdentificationContent)) {
      if (formData.govIdentificationType === 'CPF') {
        newErrors.govIdentificationContent = 'Please enter a valid CPF';
      } else {
        newErrors.govIdentificationContent = 'Identification content must be between 3 and 50 characters';
      }
    }

    // Validate email
    if (!validateRequired(formData.email)) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Validate phone number
    if (!validateRequired(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!validatePhoneNumber(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');

    if (!validateForm()) {
      return;
    }

    const registrationData = {
      customerName: formData.customerName.trim(),
      govIdentification: {
        type: formData.govIdentificationType,
        content: formData.govIdentificationContent.trim()
      },
      email: formData.email.trim(),
      phoneNumber: formData.phoneNumber.trim()
    };

    const result = await register(registrationData);
    
    if (result.success) {
      setSuccessMessage(result.message);
      // Navigate to login page after a short delay
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        type="text"
        label="Full Name"
        placeholder="Enter your full name"
        value={formData.customerName}
        onChange={(value) => handleInputChange('customerName', value)}
        error={errors.customerName}
        required
        autoComplete="name"
        disabled={isLoading}
      />

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Identification Type
        </label>
        <select
          value={formData.govIdentificationType}
          onChange={(e) => handleInputChange('govIdentificationType', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
          disabled={isLoading}
        >
          <option value="CPF">CPF (Brazilian ID)</option>
          <option value="OTHER">Other</option>
        </select>
        {errors.govIdentificationType && (
          <p className="text-red-600 text-sm">{errors.govIdentificationType}</p>
        )}
      </div>

      <Input
        type="text"
        label={formData.govIdentificationType === 'CPF' ? 'CPF' : 'Identification Number'}
        placeholder={formData.govIdentificationType === 'CPF' ? '000.000.000-00' : 'Enter your identification number'}
        value={formData.govIdentificationContent}
        onChange={(value) => handleInputChange('govIdentificationContent', value)}
        error={errors.govIdentificationContent}
        required
        autoComplete="off"
        disabled={isLoading}
      />

      <Input
        type="email"
        label="Email Address"
        placeholder="Enter your email address"
        value={formData.email}
        onChange={(value) => handleInputChange('email', value)}
        error={errors.email}
        required
        autoComplete="email"
        disabled={isLoading}
      />

      <Input
        type="text"
        label="Phone Number"
        placeholder="(00) 00000-0000"
        value={formData.phoneNumber}
        onChange={(value) => handleInputChange('phoneNumber', value)}
        error={errors.phoneNumber}
        required
        autoComplete="tel"
        disabled={isLoading}
      />

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

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
        Create Account
      </Button>

      <div className="text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <button
            type="button"
            className="text-blue-600 hover:text-blue-700 font-medium"
            onClick={() => router.push('/auth/login')}
          >
            Sign in here
          </button>
        </p>
      </div>
    </form>
  );
}; 