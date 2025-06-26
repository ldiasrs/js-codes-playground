# Domain-Based Authentication Implementation

## Overview

This document describes the implementation of the `AuthCustomerCommand` and `AuthCustomerFeature` that integrate with the existing domain architecture. The implementation follows clean architecture principles and integrates seamlessly with the existing customer domain.

## Architecture Components

### 1. Domain Layer

#### AuthCustomerFeature
**Location**: `src/learneveryday/domain/customer/usecase/AuthCustomerFeature.ts`

**Purpose**: Core business logic for customer authentication
- Validates email format
- Finds customer by email
- Generates random verification codes
- Sends verification codes via email

**Key Methods**:
- `execute(data: AuthCustomerFeatureData): Promise<AuthCustomerFeatureResult>`
- `isValidEmail(email: string): boolean`
- `generateVerificationCode(): string`

#### SendVerificationCodePort
**Location**: `src/learneveryday/domain/customer/ports/SendVerificationCodePort.ts`

**Purpose**: Port interface for sending verification codes
- Defines contract for email verification code delivery
- Supports dependency inversion principle

### 2. Application Layer

#### AuthCustomerCommand
**Location**: `src/learneveryday/application/commands/customer/AuthCustomerCommand.ts`

**Purpose**: Application command that orchestrates the authentication flow
- Converts command data to feature data
- Executes the domain feature
- Converts results to DTOs

**Key Methods**:
- `execute(): Promise<AuthCustomerCommandResult>`

### 3. Infrastructure Layer

#### NodemailerVerificationCodeSender
**Location**: `src/learneveryday/infrastructure/adapters/NodemailerVerificationCodeSender.ts`

**Purpose**: Concrete implementation of SendVerificationCodePort
- Uses existing Nodemailer infrastructure
- Sends beautifully formatted HTML emails
- Includes security warnings and branding

#### SQLCustomerRepository Enhancement
**Location**: `src/learneveryday/infrastructure/adapters/repositories/SQLCustomerRepository.ts`

**New Method**: `findByEmail(email: string): Promise<Customer | undefined>`
- Efficient database query for customer lookup
- Case-insensitive email matching

## Data Flow

```
1. AuthCustomerCommand.execute()
   ↓
2. AuthCustomerFeature.execute()
   ↓
3. CustomerRepository.findByEmail()
   ↓
4. SendVerificationCodePort.send()
   ↓
5. NodemailerVerificationCodeSender.send()
```

## Usage Examples

### Basic Usage
```typescript
import { AuthCustomerCommand } from './AuthCustomerCommand';
import { AuthCustomerFeature } from './AuthCustomerFeature';
import { SQLCustomerRepository } from './SQLCustomerRepository';
import { NodemailerVerificationCodeSender } from './NodemailerVerificationCodeSender';
import { LoggerFactory } from './LoggerFactory';

// Create dependencies
const logger = LoggerFactory.createDevelopmentLogger();
const customerRepository = new SQLCustomerRepository();
const verificationCodeSender = new NodemailerVerificationCodeSender(logger);

// Create feature
const authFeature = new AuthCustomerFeature(
  customerRepository,
  verificationCodeSender,
  logger
);

// Create and execute command
const command = new AuthCustomerCommand({ email: 'user@example.com' }, authFeature);
const result = await command.execute();

if (result.success) {
  console.log('Verification code sent:', result.verificationCode);
}
```

### Using the Example Class
```typescript
import { AuthCustomerCommandExample } from './AuthCustomerCommand.example';

const result = await AuthCustomerCommandExample.authenticateCustomer('user@example.com');
```

## Email Template

The verification code email includes:
- **Subject**: "🔐 Your Verification Code - Learn Every Day"
- **Content**: 
  - Personalized greeting with customer name
  - Large, prominent verification code display
  - Security warnings about code expiration
  - Professional styling with Learn Every Day branding

## Configuration Requirements

### Email Configuration
The system uses the existing email configuration from:
- `global-config.prod.json` (email section)
- Environment variables (EMAIL_HOST, EMAIL_PORT, etc.)

### Required Environment Variables
```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USERNAME=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com
```

## Security Features

1. **Email Validation**: Regex-based email format validation
2. **Random Code Generation**: 6-digit numeric codes (100000-999999)
3. **Case-Insensitive Lookup**: Email matching ignores case
4. **Error Handling**: Comprehensive error logging and user feedback
5. **Security Warnings**: Email includes security notices

## Integration Points

### Existing Infrastructure
- **Database**: Uses existing SQLCustomerRepository
- **Email**: Leverages existing Nodemailer setup
- **Logging**: Uses existing LoggerFactory and LoggerPort
- **Configuration**: Uses existing EmailConfiguration

### Frontend Integration
The domain implementation can be easily integrated with the existing frontend authentication flow by:
1. Replacing the MockAuthService with real domain calls
2. Using the AuthCustomerCommand in API routes
3. Storing verification codes in session/temporary storage

## Testing

### Unit Testing
```typescript
// Test the feature directly
const mockRepository = createMockCustomerRepository();
const mockEmailSender = createMockEmailSender();
const mockLogger = createMockLogger();

const feature = new AuthCustomerFeature(mockRepository, mockEmailSender, mockLogger);
const result = await feature.execute({ email: 'test@example.com' });

expect(result.success).toBe(true);
expect(result.verificationCode).toMatch(/^\d{6}$/);
```

### Integration Testing
```typescript
// Test the complete command flow
const command = new AuthCustomerCommand(
  { email: 'test@example.com' },
  authFeature
);
const result = await command.execute();

expect(result.success).toBe(true);
expect(result.customer).toBeDefined();
```

## Error Handling

### Common Error Scenarios
1. **Invalid Email Format**: Returns validation error
2. **Customer Not Found**: Returns "no account found" message
3. **Email Send Failure**: Returns "failed to send" message
4. **Database Errors**: Logged and re-thrown

### Error Response Format
```typescript
{
  success: false,
  message: "Error description for user",
  customer?: undefined,
  verificationCode?: undefined
}
```

## Future Enhancements

1. **Verification Code Storage**: Store codes in Redis with expiration
2. **Rate Limiting**: Prevent abuse with request throttling
3. **Code Expiration**: Implement time-based code expiration
4. **Multiple Attempts**: Track and limit verification attempts
5. **Audit Logging**: Enhanced security event logging

## Dependencies

- **Domain**: Customer entity, CustomerRepositoryPort
- **Infrastructure**: SQLCustomerRepository, NodemailerVerificationCodeSender
- **Shared**: LoggerPort, EmailConfiguration
- **External**: Nodemailer, UUID

## Migration from Mock Service

To migrate from the existing MockAuthService:

1. **Replace Service Calls**:
   ```typescript
   // Old
   const mockService = new MockAuthService();
   const result = await mockService.login({ email });
   
   // New
   const command = new AuthCustomerCommand({ email }, authFeature);
   const result = await command.execute();
   ```

2. **Update Response Handling**:
   ```typescript
   // The domain returns more detailed information
   if (result.success) {
     // Store verification code for verification step
     sessionStorage.setItem('verificationCode', result.verificationCode);
   }
   ```

3. **Add Verification Logic**:
   ```typescript
   // Compare user input with stored code
   const storedCode = sessionStorage.getItem('verificationCode');
   if (userInput === storedCode) {
     // Authentication successful
   }
   ```

This implementation provides a solid foundation for production-ready authentication while maintaining the clean architecture principles of the existing codebase. 