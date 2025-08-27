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

      // Calculate final balance: credits + debits (debits are already negative)
      // Account balance should be the sum of all transactions from opening balance (0)
      const finalBalance = totalCredits + totalDebits;

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

  async verifyBalanceAccuracy(accountId: string, userId: string): Promise<{
    isAccurate: boolean;
    storedBalance: string;
    calculatedBalance: string;
    difference: string;
  }> {
    try {
      // Get stored balance
      const account = await this.findById(accountId, userId);
      if (!account) {
        throw new Error('Account not found');
      }

      // Calculate actual balance
      const calculatedBalance = await this.calculateBalance(accountId, userId);
      const storedBalance = account.balance;
      
      // Calculate difference
      const storedNum = parseFloat(storedBalance);
      const calculatedNum = parseFloat(calculatedBalance);
      const difference = Math.abs(storedNum - calculatedNum).toFixed(2);
      
      // Consider accurate if difference is less than 1 cent
      const isAccurate = parseFloat(difference) < 0.01;

      return {
        isAccurate,
        storedBalance,
        calculatedBalance,
        difference
      };
    } catch (error) {
      console.error('Error verifying balance accuracy:', error);
      throw new Error('Failed to verify balance accuracy');
    }
  }

  async fixBalanceDiscrepancy(accountId: string, userId: string): Promise<Account | null> {
    try {
      const verification = await this.verifyBalanceAccuracy(accountId, userId);
      
      if (!verification.isAccurate) {
        console.warn(`Balance discrepancy detected for account ${accountId}. Stored: ${verification.storedBalance}, Calculated: ${verification.calculatedBalance}, Difference: ${verification.difference}`);
        
        // Update to calculated balance
        const result = await db
          .update(accounts)
          .set({ balance: verification.calculatedBalance, updatedAt: new Date() })
          .where(and(eq(accounts.id, accountId), eq(accounts.userId, userId)))
          .returning();

        return result[0] || null;
      }
      
      // Balance is already accurate
      return await this.findById(accountId, userId);
    } catch (error) {
      console.error('Error fixing balance discrepancy:', error);
      throw new Error('Failed to fix balance discrepancy');
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
        // Verify account exists and belongs to user before creating transaction
        const accountResult = await tx
          .select()
          .from(accounts)
          .where(and(eq(accounts.id, data.accountId), eq(accounts.userId, data.userId)))
          .limit(1);
        
        if (!accountResult[0]) {
          throw new Error('Account not found or access denied');
        }

        // Create the transaction first
        const result = await tx.insert(transactions).values(data).returning();
        const newTransaction = result[0];

        if (!newTransaction) {
          throw new Error('Failed to create transaction');
        }

        // Calculate new account balance based on all transactions
        const transactionSums = await tx
          .select({
            totalDebits: sql<string>`COALESCE(SUM(CASE WHEN amount < 0 THEN amount ELSE 0 END), 0)`,
            totalCredits: sql<string>`COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0)`
          })
          .from(transactions)
          .where(and(eq(transactions.accountId, data.accountId), eq(transactions.userId, data.userId)));

        const sums = transactionSums[0];
        const totalDebits = parseFloat(sums?.totalDebits || '0');
        const totalCredits = parseFloat(sums?.totalCredits || '0');
        
        // For correct balance calculation, we should calculate from transactions only
        // The account balance should reflect the sum of all transactions from opening balance (0)
        // Calculate final balance: credits + debits (debits are already negative)
        const finalBalance = totalCredits + totalDebits;
        const calculatedBalance = finalBalance.toFixed(2);

        // Update account balance within same transaction
        const balanceUpdateResult = await tx
          .update(accounts)
          .set({ balance: calculatedBalance, updatedAt: new Date() })
          .where(and(eq(accounts.id, data.accountId), eq(accounts.userId, data.userId)))
          .returning();
        
        if (!balanceUpdateResult[0]) {
          throw new Error('Failed to update account balance - balance update returned no results');
        }

        // Verify balance calculation accuracy by re-checking
        const verificationResult = await tx
          .select({ balance: accounts.balance })
          .from(accounts)
          .where(and(eq(accounts.id, data.accountId), eq(accounts.userId, data.userId)))
          .limit(1);

        if (!verificationResult[0] || verificationResult[0].balance !== calculatedBalance) {
          throw new Error('Balance verification failed - calculated balance does not match stored balance');
        }

        return newTransaction;
      });
    } catch (error) {
      console.error('Error creating transaction with balance update:', error);
      // Re-throw with more specific error information
      if (error instanceof Error) {
        throw new Error(`Transaction creation failed: ${error.message}`);
      }
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
        const originalResult = await tx
          .select()
          .from(transactions)
          .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
          .limit(1);

        const originalTransaction = originalResult[0];
        if (!originalTransaction) {
          throw new Error('Transaction not found');
        }

        // Store original account ID for balance recalculation
        const originalAccountId = originalTransaction.accountId;

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

        // Collect accounts that need balance updates
        const accountsToUpdate = new Set([originalAccountId]);
        if (updatedTransaction.accountId !== originalAccountId) {
          accountsToUpdate.add(updatedTransaction.accountId);
        }

        // Update balances for all affected accounts
        for (const accountId of accountsToUpdate) {
          // Get account initial balance
          const accountResult = await tx
            .select()
            .from(accounts)
            .where(and(eq(accounts.id, accountId), eq(accounts.userId, userId)))
            .limit(1);

          if (!accountResult[0]) {
            throw new Error(`Account ${accountId} not found during balance update`);
          }

          // Calculate new balance based on all transactions for this account
          const transactionSums = await tx
            .select({
              totalDebits: sql<string>`COALESCE(SUM(CASE WHEN amount < 0 THEN amount ELSE 0 END), 0)`,
              totalCredits: sql<string>`COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0)`
            })
            .from(transactions)
            .where(and(eq(transactions.accountId, accountId), eq(transactions.userId, userId)));

          const sums = transactionSums[0];
          const totalDebits = parseFloat(sums?.totalDebits || '0');
          const totalCredits = parseFloat(sums?.totalCredits || '0');

          // Calculate final balance: credits + debits (debits are already negative)
          // Account balance should be the sum of all transactions from opening balance (0)
          const finalBalance = totalCredits + totalDebits;
          const calculatedBalance = finalBalance.toFixed(2);

          // Update account balance
          const balanceUpdateResult = await tx
            .update(accounts)
            .set({ balance: calculatedBalance, updatedAt: new Date() })
            .where(and(eq(accounts.id, accountId), eq(accounts.userId, userId)))
            .returning();

          if (!balanceUpdateResult[0]) {
            throw new Error(`Failed to update balance for account ${accountId}`);
          }

          // Verify balance calculation
          const verificationResult = await tx
            .select({ balance: accounts.balance })
            .from(accounts)
            .where(and(eq(accounts.id, accountId), eq(accounts.userId, userId)))
            .limit(1);

          if (!verificationResult[0] || verificationResult[0].balance !== calculatedBalance) {
            throw new Error(`Balance verification failed for account ${accountId}`);
          }
        }

        return updatedTransaction;
      });
    } catch (error) {
      console.error('Error updating transaction with balance update:', error);
      // Re-throw with more specific error information
      if (error instanceof Error) {
        throw new Error(`Transaction update failed: ${error.message}`);
      }
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
        const transactionResult = await tx
          .select()
          .from(transactions)
          .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
          .limit(1);

        const transaction = transactionResult[0];
        if (!transaction) {
          return false; // Transaction doesn't exist, return false but don't error
        }

        const accountId = transaction.accountId;

        // Delete the transaction
        const deleteResult = await tx
          .delete(transactions)
          .where(and(eq(transactions.id, id), eq(transactions.userId, userId)));

        const deleted = (deleteResult.rowCount ?? 0) > 0;

        if (!deleted) {
          throw new Error('Failed to delete transaction');
        }

        // Get account for balance calculation
        const accountResult = await tx
          .select()
          .from(accounts)
          .where(and(eq(accounts.id, accountId), eq(accounts.userId, userId)))
          .limit(1);

        if (!accountResult[0]) {
          throw new Error('Account not found during balance update after deletion');
        }

        // Recalculate account balance after deletion
        const transactionSums = await tx
          .select({
            totalDebits: sql<string>`COALESCE(SUM(CASE WHEN amount < 0 THEN amount ELSE 0 END), 0)`,
            totalCredits: sql<string>`COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0)`
          })
          .from(transactions)
          .where(and(eq(transactions.accountId, accountId), eq(transactions.userId, userId)));

        const sums = transactionSums[0];
        const totalDebits = parseFloat(sums?.totalDebits || '0');
        const totalCredits = parseFloat(sums?.totalCredits || '0');

        // Calculate final balance: credits + debits (debits are already negative)
        // Account balance should be the sum of all transactions from opening balance (0)
        const finalBalance = totalCredits + totalDebits;
        const calculatedBalance = finalBalance.toFixed(2);

        // Update account balance
        const balanceUpdateResult = await tx
          .update(accounts)
          .set({ balance: calculatedBalance, updatedAt: new Date() })
          .where(and(eq(accounts.id, accountId), eq(accounts.userId, userId)))
          .returning();

        if (!balanceUpdateResult[0]) {
          throw new Error('Failed to update account balance after deletion');
        }

        // Verify balance calculation
        const verificationResult = await tx
          .select({ balance: accounts.balance })
          .from(accounts)
          .where(and(eq(accounts.id, accountId), eq(accounts.userId, userId)))
          .limit(1);

        if (!verificationResult[0] || verificationResult[0].balance !== calculatedBalance) {
          throw new Error('Balance verification failed after deletion');
        }

        return deleted;
      });
    } catch (error) {
      console.error('Error deleting transaction with balance update:', error);
      // Re-throw with more specific error information
      if (error instanceof Error) {
        throw new Error(`Transaction deletion failed: ${error.message}`);
      }
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
