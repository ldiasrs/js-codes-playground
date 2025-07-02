import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { JwtConfiguration } from './src/learneveryday/infrastructure/config/jwt.config';

interface JwtPayload {
  sub: string;
  email: string;
  iat: number;
  exp?: number;
  iss?: string;
}

// These routes require authentication
const protectedRoutes = [
  '/topics',
  '/api/topics',
  '/api/cron'
];

// These routes should redirect authenticated users
const authRoutes = [
  '/auth/login',
  '/auth/register',
  '/auth/verify',
  '/lending'
];

// Public routes that don't require authentication
const publicRoutes = [
  '/',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/verify'
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get JWT configuration from global config
  let jwtConfig;
  try {
    jwtConfig = JwtConfiguration.getInstance().getConfig();
  } catch (error) {
    console.error('JWT configuration error:', error);
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // Get token from Authorization header or cookie
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') 
    ? authHeader.substring(7)
    : request.cookies.get('authToken')?.value;

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );

  // Check if the route is an auth route
  const isAuthRoute = authRoutes.some(route => 
    pathname.startsWith(route)
  );

  // Check if the route is public
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route)
  );

  // Verify token if present
  let isValidToken = false;
  let userPayload: JwtPayload | null = null;

  if (token) {
    try {
      userPayload = jwt.verify(token, jwtConfig.secret) as JwtPayload;
      
      // Verify issuer if configured
      if (jwtConfig.issuer && userPayload.iss !== jwtConfig.issuer) {
        console.warn('JWT issuer mismatch');
        isValidToken = false;
      } else {
        isValidToken = true;
      }
    } catch (error) {
      console.warn('Invalid JWT token:', error);
      isValidToken = false;
    }
  }

  // Handle protected routes
  if (isProtectedRoute) {
    if (!isValidToken) {
      // Redirect to login for unauthenticated users trying to access protected routes
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Add user info to headers for API routes
    if (pathname.startsWith('/api/') && userPayload) {
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', userPayload.sub || '');
      requestHeaders.set('x-user-email', userPayload.email || '');
      
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }
  }

  // Handle auth routes - redirect authenticated users away from login/register pages
  if (isAuthRoute && isValidToken) {
    const redirectUrl = request.nextUrl.searchParams.get('redirect') || '/topics';
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  // Allow access to public routes
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Default: allow the request to continue
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}; 