'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import { User, defaultUserPreferences } from '@/lib/types/user';

/**
 * Convert Clerk user to our internal User type
 */
function convertClerkUserToUser(clerkUser: NonNullable<ReturnType<typeof useUser>['user']>): User {
  return {
    id: clerkUser.id,
    email: clerkUser.emailAddresses[0]?.emailAddress || '',
    firstName: clerkUser.firstName || '',
    lastName: clerkUser.lastName || '',
    createdAt: clerkUser.createdAt ? new Date(clerkUser.createdAt) : new Date(),
    updatedAt: clerkUser.updatedAt ? new Date(clerkUser.updatedAt) : new Date(),
    preferences: defaultUserPreferences,
  };
}

/**
 * Custom hook for authentication state
 */
export function useAuthState() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const { user: clerkUser } = useUser();

  // Convert Clerk user to our User type
  const user: User | null = clerkUser ? convertClerkUserToUser(clerkUser) : null;

  return {
    isLoaded,
    isSignedIn: isSignedIn ?? false,
    userId,
    user,
    isLoading: !isLoaded,
  };
}

import { formatUserDisplayName } from '@/lib/auth/user-utils';

/**
 * Get formatted user display name
 */
export function useUserDisplayName(): string {
  const { user } = useAuthState();
  
  if (!user) return 'Guest';
  
  return formatUserDisplayName(user);
}

import { isProfileComplete } from '@/lib/auth/user-utils';

/**
 * Check if user profile is complete
 */
export function useProfileComplete(): boolean {
  const { user } = useAuthState();
  return user ? isProfileComplete(user) : false;
}
