import { repositories } from './repositories';
import type { NewCategory, NewAccount } from './schema';

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
 * Seed sample accounts for a new user
 */
export async function seedSampleAccounts(userId: string): Promise<void> {
  try {
    const existingAccounts = await repositories.accounts.findByUserId(userId);
    
    // Only seed if user has no accounts yet
    if (existingAccounts.length === 0) {
      console.log(`Seeding sample accounts for user: ${userId}`);
      
      const sampleAccounts: Omit<NewAccount, 'id' | 'createdAt' | 'updatedAt'>[] = [
        {
          name: 'Main Checking',
          type: 'checking',
          balance: '2500.00',
          isActive: true,
          userId,
        },
        {
          name: 'High Yield Savings',
          type: 'savings',
          balance: '15000.00',
          isActive: true,
          userId,
        },
        {
          name: 'Chase Credit Card',
          type: 'credit_card',
          balance: '-850.00',
          isActive: true,
          userId,
          creditLimit: '5000.00',
        },
      ];
      
      const createdAccounts = [];
      for (const account of sampleAccounts) {
        try {
          const created = await repositories.accounts.create(account);
          createdAccounts.push(created);
        } catch (accountError) {
          console.error(`Failed to create account ${account.name} for user ${userId}:`, accountError);
        }
      }
      
      // Seed some sample transactions
      await seedSampleTransactions(userId, createdAccounts);
      
      console.log(`Successfully seeded ${sampleAccounts.length} sample accounts for user: ${userId}`);
    } else {
      console.log(`User ${userId} already has ${existingAccounts.length} accounts, skipping sample accounts`);
    }
  } catch (error) {
    console.error(`Error seeding sample accounts for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Seed sample transactions for a new user
 */
async function seedSampleTransactions(userId: string, accounts: Array<{ id: string; type: string; name: string }>): Promise<void> {
  try {
    if (accounts.length === 0) return;
    
    // Get user categories
    const categories = await repositories.categories.findByUserId(userId);
    if (categories.length === 0) return;
    
    const checkingAccount = accounts.find(a => a.type === 'checking');
    const creditCardAccount = accounts.find(a => a.type === 'credit_card');
    
    if (!checkingAccount) return;
    
    // Sample transactions for the last 30 days
    const now = new Date();
    
    const sampleTransactions = [
      {
        description: 'Salary Deposit',
        amount: '3500.00',
        categoryId: categories.find(c => c.name === 'Salary')?.id || categories[0].id,
        accountId: checkingAccount.id,
        transactionDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        userId,
      },
      {
        description: 'Grocery Store',
        amount: '-127.50',
        categoryId: categories.find(c => c.name === 'Groceries')?.id || categories[0].id,
        accountId: creditCardAccount?.id || checkingAccount.id,
        transactionDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        userId,
      },
      {
        description: 'Electric Bill',
        amount: '-89.25',
        categoryId: categories.find(c => c.name === 'Utilities')?.id || categories[0].id,
        accountId: checkingAccount.id,
        transactionDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        userId,
      },
      {
        description: 'Coffee Shop',
        amount: '-4.75',
        categoryId: categories.find(c => c.name === 'Dining Out')?.id || categories[0].id,
        accountId: creditCardAccount?.id || checkingAccount.id,
        transactionDate: new Date(now.getTime() - 6 * 60 * 60 * 1000), // 6 hours ago
        userId,
      },
      {
        description: 'Gas Station',
        amount: '-45.00',
        categoryId: categories.find(c => c.name === 'Transportation')?.id || categories[0].id,
        accountId: creditCardAccount?.id || checkingAccount.id,
        transactionDate: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
        userId,
      },
    ];
    
    for (const transaction of sampleTransactions) {
      try {
        await repositories.transactions.create(transaction);
      } catch (transactionError) {
        console.error(`Failed to create transaction ${transaction.description}:`, transactionError);
      }
    }
    
    console.log(`Successfully seeded ${sampleTransactions.length} sample transactions for user: ${userId}`);
  } catch (error) {
    console.error(`Error seeding sample transactions for user ${userId}:`, error);
  }
}
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
