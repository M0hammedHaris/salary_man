'use client';

import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';
import { LoadingSpinner } from '../ui/loading-spinner';

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
  redirectTo?: string;
}

/**
 * Component that protects routes and redirects unauthenticated users
 */
export function ProtectedRoute({ 
  children, 
  fallback, 
  redirectTo = '/sign-in' 
}: ProtectedRouteProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push(redirectTo);
    }
  }, [isLoaded, isSignedIn, router, redirectTo]);

  // Show loading while checking auth
  if (!isLoaded) {
    return fallback || <LoadingSpinner />;
  }

  // Redirect if not signed in
  if (!isSignedIn) {
    return fallback || <LoadingSpinner />;
  }

  return <>{children}</>;
}

/**
 * Higher-order component for protecting routes
 */
export function withAuth<T extends object>(
  Component: React.ComponentType<T>,
  options?: {
    fallback?: ReactNode;
    redirectTo?: string;
  }
) {
  const WrappedComponent = (props: T) => {
    return (
      <ProtectedRoute 
        fallback={options?.fallback}
        redirectTo={options?.redirectTo}
      >
        <Component {...props} />
      </ProtectedRoute>
    );
  };

  WrappedComponent.displayName = `withAuth(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}
