import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { JwtConfiguration } from './learneveryday/infrastructure/config/jwt.config';

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
];

// These routes should redirect authenticated users
const authRoutes = [
  '/auth/login',
  '/auth/register',
  '/auth/verify',
];

// Public routes that don't require authentication
const publicRoutes = [
  '/',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/verify',
  '/api/cron',
  '/lending'
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Debug: Log every middleware call
  console.log(`🔍 Middleware called for: ${pathname}`);
  console.log(`🔍 Request method: ${request.method}`);
  console.log(`🔍 Request URL: ${request.url}`);
  
  // Get JWT configuration from global config
  let jwtConfig;
  try {
    jwtConfig = JwtConfiguration.getInstance().getConfig();
    console.log(`✅ JWT config loaded successfully`);
  } catch (error) {
    console.error('🚨 JWT configuration error:', error);
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
  console.log('🚨 isProtectedRoute', isProtectedRoute);

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
      // Convert secret to Uint8Array for jose
      const secret = new TextEncoder().encode(jwtConfig.secret);
      
      const { payload } = await jwtVerify(token, secret, {
        issuer: jwtConfig.issuer,
        algorithms: [jwtConfig.algorithm],
      });
      
      userPayload = {
        sub: payload.sub || '',
        email: payload.email as string || '',
        iat: payload.iat || 0,
        exp: payload.exp,
        iss: payload.iss
      };
      
      isValidToken = true;
    } catch (error) {
      console.warn('Invalid JWT token:', error);
      isValidToken = false;
    }
  }

  // Handle protected routes
  if (isProtectedRoute) {
    console.log('🚨 isProtectedRoute 2', isProtectedRoute);
    if (!isValidToken) {
      console.log('🚨 Invalid JWT token:', isValidToken);
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
    console.log('🚨 isAuthRoute and isValidToken');
    const redirectUrl = request.nextUrl.searchParams.get('redirect') || '/topics';
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  // Allow access to public routes
  if (isPublicRoute) {
    console.log('🚨 isPublicRoute');
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