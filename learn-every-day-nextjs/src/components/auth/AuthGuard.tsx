'use client';

import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  loadingComponent?: React.ReactNode;
}

/**
 * AuthGuard component that handles authentication UI state
 * 
 * Note: The middleware handles all authentication redirects. This component
 * only manages UI state (loading, content display) without conflicting redirects.
 * 
 * @param children - The content to render if authentication check passes
 * @param requireAuth - If true, shows loading until auth is confirmed. If false, shows content immediately (default: true)
 * @param loadingComponent - Custom loading component to show while checking auth state
 */
export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  requireAuth = true,
  loadingComponent
}) => {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading state while checking authentication
  // The middleware will handle redirects if needed
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

  // For auth pages (requireAuth=false), always show content
  // The middleware will redirect authenticated users away from auth pages
  if (!requireAuth) {
    return <>{children}</>;
  }

  // For protected pages (requireAuth=true), show content if authenticated
  // The middleware will redirect unauthenticated users to login
  if (requireAuth && isAuthenticated) {
    return <>{children}</>;
  }

  // If we reach here, user is not authenticated on a protected page
  // Show loading while middleware handles the redirect
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]"></div>
      <div className="w-full max-w-md relative z-10">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    </div>
  );
}; 