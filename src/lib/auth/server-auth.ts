import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

/**
 * Server-side authentication check
 * Use this in server components and API routes
 */
export async function requireAuth(redirectTo: string = '/sign-in') {
  const { userId } = await auth();
  
  if (!userId) {
    redirect(redirectTo);
  }
  
  return userId;
}

/**
 * Check if user is authenticated (server-side)
 * Returns userId if authenticated, null otherwise
 */
export async function getAuthenticatedUserId(): Promise<string | null> {
  const { userId } = await auth();
  return userId;
}

/**
 * Get authenticated user ID or throw error
 */
export async function getRequiredUserId(): Promise<string> {
  const userId = await getAuthenticatedUserId();
  
  if (!userId) {
    throw new Error('User not authenticated');
  }
  
  return userId;
}

/**
 * Check if user has specific role/permission
 * Placeholder for future role-based access control
 */
export async function hasPermission(permission: string): Promise<boolean> {
  const userId = await getAuthenticatedUserId();
  
  if (!userId) {
    return false;
  }
  
  // TODO: Implement role/permission checking when needed
  // For now, all authenticated users have all permissions
  // Using permission parameter to avoid unused variable warning
  console.debug(`Checking permission: ${permission}`);
  return true;
}

/**
 * Require specific permission or redirect
 */
export async function requirePermission(
  permission: string, 
  redirectTo: string = '/unauthorized'
): Promise<void> {
  const hasAccess = await hasPermission(permission);
  
  if (!hasAccess) {
    redirect(redirectTo);
  }
}
