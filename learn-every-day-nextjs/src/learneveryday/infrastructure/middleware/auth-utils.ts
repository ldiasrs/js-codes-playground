import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { JwtConfiguration } from '../config/jwt.config';

interface JwtPayload {
  sub: string;
  email: string;
  iat: number;
  exp?: number;
  iss?: string;
}

interface UserFromToken {
  userId: string;
  email: string;
}

/**
 * Extracts user information from middleware headers
 * This should be used in API routes after the middleware has validated the token
 */
export function getUserFromHeaders(request: NextRequest): UserFromToken | null {
  const userId = request.headers.get('x-user-id');
  const email = request.headers.get('x-user-email');

  if (!userId || !email) {
    return null;
  }

  return {
    userId,
    email
  };
}

/**
 * Validates JWT token directly (for use outside of middleware)
 */
export function validateJwtToken(token: string): JwtPayload | null {
  try {
    const jwtConfig = JwtConfiguration.getInstance();
    const payload = jwt.verify(token, jwtConfig.getSecret()) as JwtPayload;
    
    // Verify issuer if configured
    const expectedIssuer = jwtConfig.getIssuer();
    if (expectedIssuer && payload.iss !== expectedIssuer) {
      console.warn('JWT issuer mismatch');
      return null;
    }
    
    return payload;
  } catch (error) {
    console.warn('JWT validation failed:', error);
    return null;
  }
}

/**
 * Extracts JWT token from request (Authorization header or cookie)
 */
export function extractTokenFromRequest(request: NextRequest): string | null {
  // Try Authorization header first
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Try cookie as fallback
  const tokenFromCookie = request.cookies.get('authToken')?.value;
  if (tokenFromCookie) {
    return tokenFromCookie;
  }

  return null;
}

/**
 * Creates an authenticated response with user information
 * This sets the auth token in a secure HTTP-only cookie
 */
export function createAuthenticatedResponse(token: string, redirectUrl?: string) {
  const response = redirectUrl 
    ? new Response(null, { status: 302, headers: { Location: redirectUrl } })
    : new Response(JSON.stringify({ success: true }), { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' }
      });

  // Set secure HTTP-only cookie
  response.headers.set('Set-Cookie', 
    `authToken=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=86400; Path=/`
  );

  return response;
} 