'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import { User } from '@/lib/types/user';

/**
 * Custom hook for authentication state
 */
export function useAuthState() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const { user: clerkUser } = useUser();

  // Convert Clerk user to our User type
  const user: User | null = clerkUser ? {
    id: clerkUser.id,
    email: clerkUser.emailAddresses[0]?.emailAddress || '',
    firstName: clerkUser.firstName || '',
    lastName: clerkUser.lastName || '',
    createdAt: clerkUser.createdAt ? new Date(clerkUser.createdAt) : new Date(),
    updatedAt: clerkUser.updatedAt ? new Date(clerkUser.updatedAt) : new Date(),
    preferences: {
      currency: 'USD',
      dateFormat: 'MM/dd/yyyy',
      alertThresholds: {
        creditCard: 80,
        lowBalance: 100,
      },
      notifications: {
        email: true,
        push: true,
        sms: false,
      },
    },
  } : null;

  return {
    isLoaded,
    isSignedIn: isSignedIn ?? false,
    userId,
    user,
    isLoading: !isLoaded,
  };
}

/**
 * Get formatted user display name
 */
export function useUserDisplayName(): string {
  const { user } = useAuthState();
  
  if (!user) return 'Guest';
  
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  if (user.firstName) {
    return user.firstName;
  }
  if (user.email) {
    return user.email;
  }
  return 'User';
}

/**
 * Check if user profile is complete
 */
export function useProfileComplete(): boolean {
  const { user } = useAuthState();
  return !!(user?.firstName && user?.lastName && user?.email);
}
