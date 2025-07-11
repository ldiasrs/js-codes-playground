import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { JwtConfiguration } from './learneveryday/infrastructure/config/jwt.config';

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

  if (token) {
    try {
      // Convert secret to Uint8Array for jose
      const secret = new TextEncoder().encode(jwtConfig.secret);
      
     await jwtVerify(token, secret, {
        issuer: jwtConfig.issuer,
        algorithms: [jwtConfig.algorithm],
      });
      

      isValidToken = true;
    } catch (error) {
      console.warn('Invalid JWT token:', error);
      isValidToken = false;
    }
  }

  console.log('🚨 isValidToken', isValidToken);
  console.log('🚨 isProtectedRoute', isProtectedRoute);
  console.log('🚨 isAuthRoute', isAuthRoute);
  console.log('🚨 isPublicRoute', isPublicRoute);
  // Handle protected routes
  if (isProtectedRoute) {
    if (!isValidToken) {
      console.log('🚨 Invalid JWT token:', isValidToken);
      // Redirect to login for unauthenticated users trying to access protected routes
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    console.log('🚨 Token is valid, allowing access to protected route');
    return NextResponse.next();
  }

  // Handle auth routes - redirect authenticated users away from login/register pages
  if (isAuthRoute && isValidToken) {
    console.log('🚨 isAuthRoute and isValidToken, redirecting to topics');
    return NextResponse.redirect(new URL('/topics', request.url));
  }

  // Allow access to public routes
  if (isPublicRoute) {
    console.log('🚨 isPublicRoute, allowing access to public route');
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