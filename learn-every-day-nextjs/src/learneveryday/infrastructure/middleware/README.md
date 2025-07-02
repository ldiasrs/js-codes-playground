# JWT Middleware Authentication System

This document explains the JWT-based authentication middleware system implemented for the Learn Every Day application.

## Overview

The authentication system uses:
- **JWT tokens** with proper signing (replacing the previous base64 encoding)
- **Next.js middleware** for route protection
- **Secure HTTP-only cookies** for token storage
- **Automatic user context** injection for API routes

## Components

### 1. Middleware (`middleware.ts`)

The root middleware automatically:
- ✅ **Validates JWT tokens** on every request
- ✅ **Protects routes** that require authentication
- ✅ **Redirects authenticated users** away from auth pages
- ✅ **Injects user context** into API route headers

#### Protected Routes
- `/topics` - Topics management page
- `/api/topics` - Topics API endpoints
- `/api/cron` - Cron job endpoints

#### Auth Routes (redirect authenticated users)
- `/auth/login`, `/auth/register`, `/auth/verify`, `/lending`

#### Public Routes
- `/`, `/api/auth/*`

### 2. JWT Configuration (`jwt.config.ts`)

Provides secure JWT configuration with:
- **Secret key validation** (minimum 32 characters)
- **Environment variable support**
- **Algorithm selection** (HS256, HS384, HS512)
- **Issuer verification**

### 3. Auth Utilities (`auth-utils.ts`)

Helper functions for:
- **User extraction** from middleware headers
- **Token validation** 
- **Request token extraction**
- **Secure response creation**

### 4. Updated API Routes

#### Verify Route (`/api/auth/verify`)
- Sets secure HTTP-only cookies
- Provides backward compatibility with localStorage

#### Logout Route (`/api/auth/logout`)
- Clears authentication cookies
- Provides clean logout experience

#### Protected Routes Example (`/api/topics`)
- Uses `getUserFromHeaders()` to get authenticated user
- Automatic authentication validation

## Usage Examples

### In API Routes

```typescript
import { getUserFromHeaders } from '../../../learneveryday/infrastructure/middleware/auth-utils';

export async function GET(request: NextRequest) {
  // Get authenticated user from middleware
  const user = getUserFromHeaders(request);
  if (!user) {
    return NextResponse.json(
      { message: 'Authentication required' },
      { status: 401 }
    );
  }

  // Use user.userId and user.email for user-specific operations
  console.log('Request from:', user.userId, user.email);
}
```

### Environment Variables

Add to your environment configuration:

```env
JWT_SECRET=your-super-secure-secret-key-at-least-32-characters
JWT_EXPIRES_IN=24h
JWT_ISSUER=learn-every-day
JWT_ALGORITHM=HS256
```

### Frontend Integration

The auth service now:
- ✅ **Sets secure cookies** automatically on login
- ✅ **Includes credentials** in requests
- ✅ **Handles logout** via API endpoint
- ✅ **Maintains localStorage compatibility**

## Security Features

### 🔒 Secure Cookies
- **HTTP-only**: Prevents XSS attacks
- **Secure**: HTTPS-only in production
- **SameSite=Strict**: CSRF protection
- **Auto-expiration**: 24-hour default

### 🛡️ JWT Security
- **Proper signing** with HMAC algorithms
- **Issuer verification**
- **Expiration validation**
- **Secret key length validation**

### 🚦 Route Protection
- **Automatic middleware validation**
- **User context injection**
- **Graceful error handling**
- **Redirect management**

## Migration from Previous System

The system is **backward compatible**:
- ✅ Existing localStorage tokens still work
- ✅ Frontend code requires minimal changes
- ✅ API routes get enhanced security automatically
- ✅ User experience remains the same

## How It Works

1. **User logs in** → Gets JWT token
2. **Token stored** in secure HTTP-only cookie
3. **Middleware validates** token on every request
4. **User context injected** into API route headers
5. **Routes protected** automatically

## Testing the System

### Test Protected Route
```bash
curl http://localhost:3000/api/topics
# Should return 401 without authentication

curl -H "Authorization: Bearer <your-jwt-token>" http://localhost:3000/api/topics
# Should return topics with user context
```

### Test Middleware Redirect
- Visit `/topics` without authentication → Redirects to `/auth/login`
- Visit `/auth/login` while authenticated → Redirects to `/topics`

This system provides enterprise-grade authentication security while maintaining the simplicity of your existing user experience. 