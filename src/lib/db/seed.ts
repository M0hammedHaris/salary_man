import { repositories } from './repositories';
import type { NewCategory } from './schema';

// Default categories for new users
const DEFAULT_CATEGORIES: Omit<NewCategory, 'userId'>[] = [
  // Income categories
  { name: 'Salary', type: 'income', color: '#10B981', isDefault: true },
  { name: 'Freelance', type: 'income', color: '#059669', isDefault: true },
  { name: 'Investment', type: 'income', color: '#047857', isDefault: true },
  { name: 'Bonus', type: 'income', color: '#065F46', isDefault: true },
  { name: 'Other Income', type: 'income', color: '#064E3B', isDefault: true },

  // Expense categories
  { name: 'Groceries', type: 'expense', color: '#EF4444', isDefault: true },
  { name: 'Housing', type: 'expense', color: '#DC2626', isDefault: true },
  { name: 'Transportation', type: 'expense', color: '#B91C1C', isDefault: true },
  { name: 'Utilities', type: 'expense', color: '#991B1B', isDefault: true },
  { name: 'Healthcare', type: 'expense', color: '#7F1D1D', isDefault: true },
  { name: 'Entertainment', type: 'expense', color: '#F59E0B', isDefault: true },
  { name: 'Dining Out', type: 'expense', color: '#D97706', isDefault: true },
  { name: 'Shopping', type: 'expense', color: '#B45309', isDefault: true },
  { name: 'Education', type: 'expense', color: '#92400E', isDefault: true },
  { name: 'Insurance', type: 'expense', color: '#78350F', isDefault: true },
  { name: 'Savings', type: 'expense', color: '#3B82F6', isDefault: true },
  { name: 'Debt Payment', type: 'expense', color: '#1D4ED8', isDefault: true },
  { name: 'Other Expense', type: 'expense', color: '#1E40AF', isDefault: true },
];

/**
 * Seed default categories for a new user
 */
export async function seedDefaultCategories(userId: string): Promise<void> {
  try {
    if (!userId || userId.trim() === '') {
      throw new Error('User ID is required for seeding categories');
    }

    const existingCategories = await repositories.categories.findByUserId(userId);
    
    // Only seed if user has no categories yet
    if (existingCategories.length === 0) {
      console.log(`Seeding default categories for user: ${userId}`);
      
      for (const category of DEFAULT_CATEGORIES) {
        try {
          await repositories.categories.create({
            ...category,
            userId,
          });
        } catch (categoryError) {
          console.error(`Failed to create category ${category.name} for user ${userId}:`, categoryError);
          // Continue with other categories rather than failing completely
        }
      }
      
      console.log(`Successfully seeded ${DEFAULT_CATEGORIES.length} default categories for user: ${userId}`);
    } else {
      console.log(`User ${userId} already has ${existingCategories.length} categories, skipping seed`);
    }
  } catch (error) {
    console.error(`Error seeding default categories for user ${userId}:`, error);
    throw error; // Re-throw to let caller handle appropriately
  }
}

/**
 * Get all global default categories (for system initialization)
 */
export async function getDefaultCategories() {
  return repositories.categories.findDefaultCategories();
}

/**
 * Initialize system with global default categories (run once)
 */
export async function initializeDefaultCategories(): Promise<void> {
  const systemUserId = 'system';
  
  for (const category of DEFAULT_CATEGORIES) {
    const existing = await repositories.categories.findByUserId(systemUserId);
    const categoryExists = existing.some(c => c.name === category.name && c.type === category.type);
    
    if (!categoryExists) {
      await repositories.categories.create({
        ...category,
        userId: systemUserId,
      });
    }
  }
}
