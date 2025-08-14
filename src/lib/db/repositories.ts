import { eq, and, desc, asc, sql } from 'drizzle-orm';
import { db } from './index';
import { users, accounts, categories, transactions, recurringPayments } from './schema';
import type { 
  User, 
  NewUser, 
  Account, 
  NewAccount, 
  Category, 
  NewCategory, 
  Transaction, 
  NewTransaction, 
  RecurringPayment, 
  NewRecurringPayment 
} from './schema';

// User Repository
export class UserRepository {
  async findById(id: string): Promise<User | null> {
    try {
      const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
      return result[0] || null;
    } catch (error) {
      console.error('Error finding user by id:', error);
      throw new Error('Failed to find user');
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
      return result[0] || null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw new Error('Failed to find user');
    }
  }

  async create(data: NewUser): Promise<User> {
    try {
      const result = await db.insert(users).values(data).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error('Failed to create user');
    }
  }

  async update(id: string, data: Partial<NewUser>): Promise<User | null> {
    try {
      const result = await db
        .update(users)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning();
      return result[0] || null;
    } catch (error) {
      console.error('Error updating user:', error);
      throw new Error('Failed to update user');
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const result = await db.delete(users).where(eq(users.id, id));
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new Error('Failed to delete user');
    }
  }
}

// Account Repository
export class AccountRepository {
  async findByUserId(userId: string): Promise<Account[]> {
    try {
      return await db
        .select()
        .from(accounts)
        .where(and(eq(accounts.userId, userId), eq(accounts.isActive, true)))
        .orderBy(asc(accounts.name));
    } catch (error) {
      console.error('Error finding accounts by user id:', error);
      throw new Error('Failed to find user accounts');
    }
  }

  async findById(id: string, userId: string): Promise<Account | null> {
    try {
      const result = await db
        .select()
        .from(accounts)
        .where(and(eq(accounts.id, id), eq(accounts.userId, userId)))
        .limit(1);
      return result[0] || null;
    } catch (error) {
      console.error('Error finding account by id:', error);
      throw new Error('Failed to find account');
    }
  }

  async create(data: NewAccount): Promise<Account> {
    try {
      const result = await db.insert(accounts).values(data).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating account:', error);
      throw new Error('Failed to create account');
    }
  }

  async update(id: string, userId: string, data: Partial<NewAccount>): Promise<Account | null> {
    try {
      const result = await db
        .update(accounts)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(accounts.id, id), eq(accounts.userId, userId)))
        .returning();
      return result[0] || null;
    } catch (error) {
      console.error('Error updating account:', error);
      throw new Error('Failed to update account');
    }
  }

  async delete(id: string, userId: string): Promise<boolean> {
    try {
      // Soft delete - set isActive to false
      const result = await db
        .update(accounts)
        .set({ isActive: false, updatedAt: new Date() })
        .where(and(eq(accounts.id, id), eq(accounts.userId, userId)));
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error('Error deleting account:', error);
      throw new Error('Failed to delete account');
    }
  }

  async hasTransactions(accountId: string, userId: string): Promise<boolean> {
    try {
      const result = await db
        .select({ count: transactions.id })
        .from(transactions)
        .where(and(eq(transactions.accountId, accountId), eq(transactions.userId, userId)))
        .limit(1);
      return result.length > 0;
    } catch (error) {
      console.error('Error checking account transactions:', error);
      throw new Error('Failed to check account transactions');
    }
  }

  async calculateBalance(accountId: string, userId: string): Promise<string> {
    try {
      // Get initial balance from account
      const account = await this.findById(accountId, userId);
      if (!account) {
        throw new Error('Account not found');
      }

      // Calculate actual balance based on transactions
      const transactionSums = await db
        .select({
          totalDebits: sql<string>`COALESCE(SUM(CASE WHEN amount < 0 THEN amount ELSE 0 END), 0)`,
          totalCredits: sql<string>`COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0)`
        })
        .from(transactions)
        .where(and(eq(transactions.accountId, accountId), eq(transactions.userId, userId)));

      const sums = transactionSums[0];
      const totalDebits = parseFloat(sums?.totalDebits || '0');
      const totalCredits = parseFloat(sums?.totalCredits || '0');
      const initialBalance = parseFloat(account.balance);

      // Calculate final balance: initial + credits - debits
      const finalBalance = initialBalance + totalCredits + totalDebits; // totalDebits is already negative

      return finalBalance.toFixed(2);
    } catch (error) {
      console.error('Error calculating account balance:', error);
      throw new Error('Failed to calculate account balance');
    }
  }

  async updateAccountBalance(accountId: string, userId: string): Promise<Account | null> {
    try {
      const calculatedBalance = await this.calculateBalance(accountId, userId);
      
      const result = await db
        .update(accounts)
        .set({ balance: calculatedBalance, updatedAt: new Date() })
        .where(and(eq(accounts.id, accountId), eq(accounts.userId, userId)))
        .returning();
        
      return result[0] || null;
    } catch (error) {
      console.error('Error updating account balance:', error);
      throw new Error('Failed to update account balance');
    }
  }
}

// Category Repository
export class CategoryRepository {
  async findByUserId(userId: string): Promise<Category[]> {
    return await db
      .select()
      .from(categories)
      .where(eq(categories.userId, userId))
      .orderBy(asc(categories.name));
  }

  async findById(id: string, userId: string): Promise<Category | null> {
    const result = await db
      .select()
      .from(categories)
      .where(and(eq(categories.id, id), eq(categories.userId, userId)))
      .limit(1);
    return result[0] || null;
  }

  async findDefaultCategories(): Promise<Category[]> {
    return await db
      .select()
      .from(categories)
      .where(eq(categories.isDefault, true))
      .orderBy(asc(categories.name));
  }

  async create(data: NewCategory): Promise<Category> {
    const result = await db.insert(categories).values(data).returning();
    return result[0];
  }

  async update(id: string, userId: string, data: Partial<NewCategory>): Promise<Category | null> {
    const result = await db
      .update(categories)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(categories.id, id), eq(categories.userId, userId)))
      .returning();
    return result[0] || null;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(categories)
      .where(and(eq(categories.id, id), eq(categories.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }
}

// Transaction Repository
export class TransactionRepository {
  async findByUserId(
    userId: string, 
    filters: {
      accountId?: string;
      categoryId?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<Transaction[]> {
    try {
      const { accountId, categoryId, startDate, endDate, limit = 50, offset = 0 } = filters;
      
      // Build conditions array
      const conditions = [eq(transactions.userId, userId)];
      
      if (accountId) {
        conditions.push(eq(transactions.accountId, accountId));
      }
      
      if (categoryId) {
        conditions.push(eq(transactions.categoryId, categoryId));
      }
      
      if (startDate) {
        conditions.push(sql`${transactions.transactionDate} >= ${startDate}`);
      }
      
      if (endDate) {
        conditions.push(sql`${transactions.transactionDate} <= ${endDate}`);
      }
      
      return await db
        .select()
        .from(transactions)
        .where(and(...conditions))
        .orderBy(desc(transactions.transactionDate))
        .limit(limit)
        .offset(offset);
    } catch (error) {
      console.error('Error finding transactions by user id:', error);
      throw new Error('Failed to find user transactions');
    }
  }

  async findById(id: string, userId: string): Promise<Transaction | null> {
    try {
      const result = await db
        .select()
        .from(transactions)
        .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
        .limit(1);
      return result[0] || null;
    } catch (error) {
      console.error('Error finding transaction by id:', error);
      throw new Error('Failed to find transaction');
    }
  }

  async findByAccountId(accountId: string, userId: string): Promise<Transaction[]> {
    try {
      return await db
        .select()
        .from(transactions)
        .where(and(eq(transactions.accountId, accountId), eq(transactions.userId, userId)))
        .orderBy(desc(transactions.transactionDate));
    } catch (error) {
      console.error('Error finding transactions by account id:', error);
      throw new Error('Failed to find account transactions');
    }
  }

  async create(data: NewTransaction): Promise<Transaction> {
    try {
      const result = await db.insert(transactions).values(data).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw new Error('Failed to create transaction');
    }
  }

  async createWithBalanceUpdate(data: NewTransaction): Promise<Transaction> {
    try {
      // Start a transaction to ensure atomicity
      return await db.transaction(async (tx) => {
        // Create the transaction
        const result = await tx.insert(transactions).values(data).returning();
        const newTransaction = result[0];

        // Update account balance - we need to use the same transaction context
        const accountRepo = new AccountRepository();
        const updatedAccount = await accountRepo.updateAccountBalance(data.accountId, data.userId);
        
        if (!updatedAccount) {
          throw new Error('Failed to update account balance');
        }

        return newTransaction;
      });
    } catch (error) {
      console.error('Error creating transaction with balance update:', error);
      throw new Error('Failed to create transaction and update balance');
    }
  }

  async update(id: string, userId: string, data: Partial<NewTransaction>): Promise<Transaction | null> {
    try {
      const result = await db
        .update(transactions)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
        .returning();
      return result[0] || null;
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw new Error('Failed to update transaction');
    }
  }

  async updateWithBalanceUpdate(id: string, userId: string, data: Partial<NewTransaction>): Promise<Transaction | null> {
    try {
      // Start a transaction to ensure atomicity
      return await db.transaction(async (tx) => {
        // Get original transaction for account comparison
        const originalTransaction = await this.findById(id, userId);
        if (!originalTransaction) {
          throw new Error('Transaction not found');
        }

        // Update the transaction
        const result = await tx
          .update(transactions)
          .set({ ...data, updatedAt: new Date() })
          .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
          .returning();

        const updatedTransaction = result[0];
        if (!updatedTransaction) {
          throw new Error('Failed to update transaction');
        }

        // Update balance for original account if account changed
        const accountRepo = new AccountRepository();
        if (data.accountId && data.accountId !== originalTransaction.accountId) {
          await accountRepo.updateAccountBalance(originalTransaction.accountId, userId);
        }

        // Update balance for new/current account
        await accountRepo.updateAccountBalance(
          updatedTransaction.accountId, 
          userId
        );

        return updatedTransaction;
      });
    } catch (error) {
      console.error('Error updating transaction with balance update:', error);
      throw new Error('Failed to update transaction and balance');
    }
  }

  async delete(id: string, userId: string): Promise<boolean> {
    try {
      const result = await db
        .delete(transactions)
        .where(and(eq(transactions.id, id), eq(transactions.userId, userId)));
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw new Error('Failed to delete transaction');
    }
  }

  async deleteWithBalanceUpdate(id: string, userId: string): Promise<boolean> {
    try {
      // Start a transaction to ensure atomicity
      return await db.transaction(async (tx) => {
        // Get transaction details before deletion
        const transaction = await this.findById(id, userId);
        if (!transaction) {
          return false;
        }

        // Delete the transaction
        const result = await tx
          .delete(transactions)
          .where(and(eq(transactions.id, id), eq(transactions.userId, userId)));

        const deleted = (result.rowCount ?? 0) > 0;

        if (deleted) {
          // Update account balance after deletion
          const accountRepo = new AccountRepository();
          await accountRepo.updateAccountBalance(transaction.accountId, userId);
        }

        return deleted;
      });
    } catch (error) {
      console.error('Error deleting transaction with balance update:', error);
      throw new Error('Failed to delete transaction and update balance');
    }
  }
}

// Recurring Payment Repository
export class RecurringPaymentRepository {
  async findByUserId(userId: string): Promise<RecurringPayment[]> {
    return await db
      .select()
      .from(recurringPayments)
      .where(and(eq(recurringPayments.userId, userId), eq(recurringPayments.isActive, true)))
      .orderBy(asc(recurringPayments.nextDueDate));
  }

  async findById(id: string, userId: string): Promise<RecurringPayment | null> {
    const result = await db
      .select()
      .from(recurringPayments)
      .where(and(eq(recurringPayments.id, id), eq(recurringPayments.userId, userId)))
      .limit(1);
    return result[0] || null;
  }

  async create(data: NewRecurringPayment): Promise<RecurringPayment> {
    const result = await db.insert(recurringPayments).values(data).returning();
    return result[0];
  }

  async update(id: string, userId: string, data: Partial<NewRecurringPayment>): Promise<RecurringPayment | null> {
    const result = await db
      .update(recurringPayments)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(recurringPayments.id, id), eq(recurringPayments.userId, userId)))
      .returning();
    return result[0] || null;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const result = await db
      .update(recurringPayments)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(eq(recurringPayments.id, id), eq(recurringPayments.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }
}

// Database Service Factory
export const repositories = {
  users: new UserRepository(),
  accounts: new AccountRepository(),
  categories: new CategoryRepository(),
  transactions: new TransactionRepository(),
  recurringPayments: new RecurringPaymentRepository(),
};
