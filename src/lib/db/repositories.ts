import { eq, and, desc, asc } from 'drizzle-orm';
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
    return await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.userId, userId), eq(accounts.isActive, true)))
      .orderBy(asc(accounts.name));
  }

  async findById(id: string, userId: string): Promise<Account | null> {
    const result = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.id, id), eq(accounts.userId, userId)))
      .limit(1);
    return result[0] || null;
  }

  async create(data: NewAccount): Promise<Account> {
    const result = await db.insert(accounts).values(data).returning();
    return result[0];
  }

  async update(id: string, userId: string, data: Partial<NewAccount>): Promise<Account | null> {
    const result = await db
      .update(accounts)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(accounts.id, id), eq(accounts.userId, userId)))
      .returning();
    return result[0] || null;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const result = await db
      .update(accounts)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(eq(accounts.id, id), eq(accounts.userId, userId)));
    return (result.rowCount ?? 0) > 0;
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
  async findByUserId(userId: string, limit: number = 50, offset: number = 0): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.transactionDate))
      .limit(limit)
      .offset(offset);
  }

  async findById(id: string, userId: string): Promise<Transaction | null> {
    const result = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
      .limit(1);
    return result[0] || null;
  }

  async findByAccountId(accountId: string, userId: string): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.accountId, accountId), eq(transactions.userId, userId)))
      .orderBy(desc(transactions.transactionDate));
  }

  async create(data: NewTransaction): Promise<Transaction> {
    const result = await db.insert(transactions).values(data).returning();
    return result[0];
  }

  async update(id: string, userId: string, data: Partial<NewTransaction>): Promise<Transaction | null> {
    const result = await db
      .update(transactions)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
      .returning();
    return result[0] || null;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)));
    return (result.rowCount ?? 0) > 0;
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
