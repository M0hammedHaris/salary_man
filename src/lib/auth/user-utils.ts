import { User, UserPreferences, defaultUserPreferences } from '@/lib/types/user';
import { currentUser } from '@clerk/nextjs/server';

/**
 * Get the current authenticated user from Clerk
 * @returns Promise<User | null>
 */
export async function getCurrentUser(): Promise<User | null> {
  const clerkUser = await currentUser();
  
  if (!clerkUser) {
    return null;
  }

  // For now, we'll create the user object from Clerk data
  // In a production app, this would sync with your database
  const user: User = {
    id: clerkUser.id,
    email: clerkUser.emailAddresses[0]?.emailAddress || '',
    firstName: clerkUser.firstName || '',
    lastName: clerkUser.lastName || '',
    createdAt: clerkUser.createdAt ? new Date(clerkUser.createdAt) : new Date(),
    updatedAt: clerkUser.updatedAt ? new Date(clerkUser.updatedAt) : new Date(),
    preferences: await getUserPreferences(clerkUser.id),
  };

  return user;
}

/**
 * Get user preferences (from local storage or database)
 * For now, returns default preferences. In production, this would fetch from database.
 */
export async function getUserPreferences(userId: string): Promise<UserPreferences> {
  // TODO: Implement database fetching when database is set up
  // For now, return default preferences
  // Using userId parameter to avoid unused variable warning
  console.debug(`Getting preferences for user: ${userId}`);
  return defaultUserPreferences;
}

/**
 * Update user preferences
 * For now, this is a placeholder. In production, this would save to database.
 */
export async function updateUserPreferences(
  userId: string,
  preferences: Partial<UserPreferences>
): Promise<UserPreferences> {
  // TODO: Implement database saving when database is set up
  // For now, return merged preferences
  const currentPrefs = await getUserPreferences(userId);
  const updatedPreferences = {
    ...currentPrefs,
    ...preferences,
    alertThresholds: {
      ...currentPrefs.alertThresholds,
      ...(preferences.alertThresholds || {}),
    },
    notifications: {
      ...currentPrefs.notifications,
      ...(preferences.notifications || {}),
    },
  };
  
  return updatedPreferences;
}

/**
 * Format user display name
 */
export function formatUserDisplayName(user: User): string {
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
 * Check if user has completed profile setup
 */
export function isProfileComplete(user: User): boolean {
  return !!(user.firstName && user.lastName && user.email);
}
