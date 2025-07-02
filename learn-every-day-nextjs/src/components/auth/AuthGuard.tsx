'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface AuthGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
  requireAuth?: boolean;
  loadingComponent?: React.ReactNode;
}

/**
 * AuthGuard component that handles authentication checks and redirects
 * 
 * @param children - The content to render if authentication check passes
 * @param redirectTo - Where to redirect if authentication check fails (default: '/lending')
 * @param requireAuth - If true, redirects unauthenticated users. If false, redirects authenticated users (default: true)
 * @param loadingComponent - Custom loading component to show while checking auth state
 */
export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  redirectTo = '/',
  requireAuth = true,
  loadingComponent
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (requireAuth && !isAuthenticated) {
        console.log('🚨 AuthGuard: redirecting to login');
        // Require auth but user is not authenticated - redirect to specified page
        router.push(redirectTo);
      } else if (!requireAuth && isAuthenticated) {
        // Don't require auth but user is authenticated - redirect to topics
        console.log('🚨 AuthGuard: redirecting to topics');
        router.push('/topics');
      }
    }
  }, [isAuthenticated, isLoading, router, requireAuth, redirectTo]);

  // Show loading state while checking authentication
  if (isLoading) {
    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]"></div>
        <div className="w-full max-w-md relative z-10">
          <div className="text-center">
            <LoadingSpinner size="lg" className="mx-auto mb-4" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Don't render children if redirecting
  if (requireAuth && !isAuthenticated) {
    return null; // Will redirect to specified page
  }

  if (!requireAuth && isAuthenticated) {
    return null; // Will redirect to topics
  }

  // Render children if authentication check passes
  return <>{children}</>;
}; 