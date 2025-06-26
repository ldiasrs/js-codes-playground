# Authentication System Documentation

## Overview

This project implements a complete authentication flow with email-based login and verification code authentication. The system is built using Next.js 15 with TypeScript and follows clean architecture principles.

## Features

- **Email-based Authentication**: Users enter their email to initiate login
- **Verification Code**: 6-digit code sent to email for verification
- **Mock Service**: Simulated authentication with realistic delays
- **Persistent State**: Authentication state persists across page refreshes
- **Responsive UI**: Modern, mobile-friendly interface
- **Type Safety**: Full TypeScript implementation

## Authentication Flow

1. **Lending Page** (`/lending`): Users choose between Sign In or Create Account
2. **Login Page** (`/auth/login`): Users enter their email address
3. **Verification Page** (`/auth/verify`): Users enter the 6-digit verification code
4. **Dashboard** (`/dashboard`): Authenticated users see their personalized dashboard

## Mock Authentication Details

### Test Credentials
- **Email**: Any valid email format (e.g., `user@example.com`)
- **Verification Code**: `123456`

### Simulated Delays
- **Login Request**: 2 seconds
- **Verification Request**: 1.5 seconds
- **Logout**: 0.5 seconds

## Project Structure

```
src/
├── components/
│   ├── ui/                    # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   └── LoadingSpinner.tsx
│   └── auth/                  # Authentication components
│       ├── AuthLayout.tsx
│       ├── LoginForm.tsx
│       └── VerificationForm.tsx
├── services/
│   └── auth/                  # Authentication service layer
│       ├── AuthService.ts     # Service interface
│       ├── MockAuthService.ts # Mock implementation
│       └── types.ts           # TypeScript types
├── hooks/
│   └── useAuth.ts             # Authentication state management
└── app/                       # Next.js app router pages
    ├── lending/
    ├── auth/
    │   ├── login/
    │   ├── verify/
    │   └── register/
    └── dashboard/
```

## Key Components

### UI Components
- **Button**: Configurable button with loading states and variants
- **Input**: Form input with validation and error handling
- **Card**: Container component for content sections
- **LoadingSpinner**: Animated loading indicator

### Authentication Components
- **AuthLayout**: Consistent layout for authentication pages
- **LoginForm**: Email input form with validation
- **VerificationForm**: Code verification form with resend functionality

### Service Layer
- **AuthService**: Interface defining authentication operations
- **MockAuthService**: Mock implementation with simulated API calls
- **useAuth Hook**: React hook for managing authentication state

## Usage

### Starting the Application
```bash
npm run dev
```

The application will start on `http://localhost:3000` and automatically redirect to the lending page.

### Testing the Authentication Flow

1. Navigate to the lending page
2. Click "Sign In"
3. Enter any valid email address
4. Wait for the verification code to be "sent"
5. Enter the verification code: `123456`
6. You'll be redirected to the dashboard

### State Management

The authentication state is managed using:
- **localStorage**: Persists user data and token
- **sessionStorage**: Stores pending email during verification
- **React Context**: Provides authentication state to components

## Implementation Notes

### Mock Service Features
- Email validation using regex
- Simulated API delays for realistic UX
- Error handling for invalid inputs
- Session management for verification flow

### Security Considerations
- Email format validation
- Verification code validation
- Secure token generation (mock)
- Proper state cleanup on logout

### Future Enhancements
- Real API integration
- Password-based authentication
- Social login options
- Two-factor authentication
- Account recovery flow

## Development

### Adding Real Authentication
To replace the mock service with real authentication:

1. Create a new service implementing `AuthService` interface
2. Replace `MockAuthService` in `useAuth.ts`
3. Update API endpoints and error handling
4. Implement proper token management

### Styling
The application uses Tailwind CSS for styling. All components are responsive and follow a consistent design system.

### TypeScript
All components and services are fully typed for better development experience and error prevention. 