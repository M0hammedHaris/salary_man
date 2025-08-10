import { User } from '@/lib/types/user';
import type { WebhookEvent } from '@clerk/nextjs/server';
import { repositories } from '@/lib/db/repositories';
import { seedDefaultCategories } from '@/lib/db/seed';

interface ClerkUserData {
  id: string;
  email_addresses: Array<{ email_address: string }>;
  first_name: string | null;
  last_name: string | null;
}

/**
 * Synchronize Clerk user with local database
 * This will be called from Clerk webhooks when user data changes
 */
export async function syncUserWithDatabase(clerkUser: ClerkUserData): Promise<User | null> {
  try {
    const email = clerkUser.email_addresses[0]?.email_address;
    if (!email) {
      console.error('No email found for user:', clerkUser.id);
      return null;
    }

    const userData = {
      id: clerkUser.id,
      email,
      firstName: clerkUser.first_name || '',
      lastName: clerkUser.last_name || '',
    };

    // Check if user already exists
    let user = await repositories.users.findById(clerkUser.id);
    
    if (!user) {
      // Create new user
      user = await repositories.users.create(userData);
      console.log('Created new user in database:', user.id);
      
      // Seed default categories for new user
      await seedDefaultCategories(user.id);
      console.log('Seeded default categories for user:', user.id);
    } else {
      // Update existing user
      user = await repositories.users.update(clerkUser.id, {
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
      });
      console.log('Updated existing user in database:', user?.id);
    }
    
    return user;
  } catch (error) {
    console.error('Error syncing user with database:', error);
    throw error; // Re-throw for proper error handling
  }
}

/**
 * Handle Clerk webhook events for user synchronization
 */
export async function handleClerkWebhook(event: WebhookEvent): Promise<void> {
  try {
    switch (event.type) {
      case 'user.created':
        console.log('User created webhook:', event.data.id);
        await syncUserWithDatabase(event.data);
        break;
        
      case 'user.updated':
        console.log('User updated webhook:', event.data.id);
        await syncUserWithDatabase(event.data);
        break;
        
      case 'user.deleted':
        console.log('User deleted webhook:', event.data.id);
        await deleteUser(event.data.id || '');
        break;
        
      default:
        console.log('Unhandled webhook event:', event.type);
    }
  } catch (error) {
    console.error(`Error handling webhook event ${event.type}:`, error);
    throw error; // Re-throw to let the API route handle HTTP response
  }
}

/**
 * Create or update user in database
 * This function is called from authentication flows
 */
export async function createOrUpdateUser(userData: {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}): Promise<User | null> {
  try {
    // Check if user exists
    let user = await repositories.users.findById(userData.id);
    
    if (!user) {
      // Create new user
      user = await repositories.users.create({
        id: userData.id,
        email: userData.email,
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
      });
      
      // Seed default categories for new user
      await seedDefaultCategories(user.id);
    } else {
      // Update existing user
      user = await repositories.users.update(userData.id, {
        email: userData.email,
        firstName: userData.firstName || user.firstName,
        lastName: userData.lastName || user.lastName,
      });
    }
    
    return user;
  } catch (error) {
    console.error('Error creating/updating user:', error);
    return null;
  }
}

/**
 * Delete user from database
 * This cascades to all related data (accounts, transactions, categories)
 */
export async function deleteUser(userId: string): Promise<boolean> {
  try {
    const deleted = await repositories.users.delete(userId);
    console.log('Deleted user from database:', userId, 'Success:', deleted);
    return deleted;
  } catch (error) {
    console.error('Error deleting user from database:', error);
    return false;
  }
}

/**
 * Get user from database
 */
export async function getUserFromDatabase(userId: string): Promise<User | null> {
  try {
    return await repositories.users.findById(userId);
  } catch (error) {
    console.error('Error getting user from database:', error);
    return null;
  }
}
