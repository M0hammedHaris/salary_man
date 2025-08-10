import { Decimal } from 'decimal.js';
import { repositories } from '../db/repositories';
import { toDecimal, toDecimalRequired, fromDecimal, fromDecimalRequired } from '../utils/decimal';
import type { 
  Account as DbAccount, 
  NewAccount as DbNewAccount,
  Transaction as DbTransaction, 
  NewTransaction as DbNewTransaction,
  RecurringPayment as DbRecurringPayment,
  NewRecurringPayment as DbNewRecurringPayment
} from '../db/schema';

/**
 * Enhanced types with proper Decimal handling for the service layer
 * These types ensure financial precision at the application level
 */
export interface Account extends Omit<DbAccount, 'balance' | 'creditLimit'> {
  balance: Decimal;
  creditLimit: Decimal | null;
}

export interface NewAccount extends Omit<DbNewAccount, 'balance' | 'creditLimit'> {
  balance?: Decimal;
  creditLimit?: Decimal | null;
}

export interface Transaction extends Omit<DbTransaction, 'amount'> {
  amount: Decimal;
}

export interface NewTransaction extends Omit<DbNewTransaction, 'amount'> {
  amount: Decimal;
}

export interface RecurringPayment extends Omit<DbRecurringPayment, 'amount'> {
  amount: Decimal;
}

export interface NewRecurringPayment extends Omit<DbNewRecurringPayment, 'amount'> {
  amount: Decimal;
}

/**
 * Financial Service Layer
 * Provides decimal-aware operations for financial entities
 * Acts as a facade over the repository layer with proper type safety
 */
export class FinancialService {
  /**
   * Account operations with decimal precision
   */
  async getAccountsByUserId(userId: string): Promise<Account[]> {
    const dbAccounts = await repositories.accounts.findByUserId(userId);
    return dbAccounts.map(this.transformAccountFromDb);
  }

  async getAccountById(id: string, userId: string): Promise<Account | null> {
    const dbAccount = await repositories.accounts.findById(id, userId);
    return dbAccount ? this.transformAccountFromDb(dbAccount) : null;
  }

  async createAccount(data: NewAccount): Promise<Account> {
    const dbData = this.transformAccountToDb(data);
    const dbAccount = await repositories.accounts.create(dbData);
    return this.transformAccountFromDb(dbAccount);
  }

  async updateAccount(id: string, userId: string, data: Partial<NewAccount>): Promise<Account | null> {
    const dbData = this.transformAccountToDb(data);
    const dbAccount = await repositories.accounts.update(id, userId, dbData);
    return dbAccount ? this.transformAccountFromDb(dbAccount) : null;
  }

  async deleteAccount(id: string, userId: string): Promise<boolean> {
    return await repositories.accounts.delete(id, userId);
  }

  /**
   * Transaction operations with decimal precision
   */
  async getTransactionsByUserId(userId: string, limit?: number, offset?: number): Promise<Transaction[]> {
    const dbTransactions = await repositories.transactions.findByUserId(userId, limit, offset);
    return dbTransactions.map(this.transformTransactionFromDb);
  }

  async getTransactionById(id: string, userId: string): Promise<Transaction | null> {
    const dbTransaction = await repositories.transactions.findById(id, userId);
    return dbTransaction ? this.transformTransactionFromDb(dbTransaction) : null;
  }

  async getTransactionsByAccountId(accountId: string, userId: string): Promise<Transaction[]> {
    const dbTransactions = await repositories.transactions.findByAccountId(accountId, userId);
    return dbTransactions.map(this.transformTransactionFromDb);
  }

  async createTransaction(data: NewTransaction): Promise<Transaction> {
    const dbData = this.transformTransactionToDb(data);
    const dbTransaction = await repositories.transactions.create(dbData);
    return this.transformTransactionFromDb(dbTransaction);
  }

  async updateTransaction(id: string, userId: string, data: Partial<NewTransaction>): Promise<Transaction | null> {
    const dbData = this.transformTransactionToDb(data);
    const dbTransaction = await repositories.transactions.update(id, userId, dbData);
    return dbTransaction ? this.transformTransactionFromDb(dbTransaction) : null;
  }

  async deleteTransaction(id: string, userId: string): Promise<boolean> {
    return await repositories.transactions.delete(id, userId);
  }

  /**
   * Recurring Payment operations with decimal precision
   */
  async getRecurringPaymentsByUserId(userId: string): Promise<RecurringPayment[]> {
    const dbPayments = await repositories.recurringPayments.findByUserId(userId);
    return dbPayments.map(this.transformRecurringPaymentFromDb);
  }

  async getRecurringPaymentById(id: string, userId: string): Promise<RecurringPayment | null> {
    const dbPayment = await repositories.recurringPayments.findById(id, userId);
    return dbPayment ? this.transformRecurringPaymentFromDb(dbPayment) : null;
  }

  async createRecurringPayment(data: NewRecurringPayment): Promise<RecurringPayment> {
    const dbData = this.transformRecurringPaymentToDb(data);
    const dbPayment = await repositories.recurringPayments.create(dbData);
    return this.transformRecurringPaymentFromDb(dbPayment);
  }

  async updateRecurringPayment(id: string, userId: string, data: Partial<NewRecurringPayment>): Promise<RecurringPayment | null> {
    const dbData = this.transformRecurringPaymentToDb(data);
    const dbPayment = await repositories.recurringPayments.update(id, userId, dbData);
    return dbPayment ? this.transformRecurringPaymentFromDb(dbPayment) : null;
  }

  async deleteRecurringPayment(id: string, userId: string): Promise<boolean> {
    return await repositories.recurringPayments.delete(id, userId);
  }

  /**
   * Financial calculation utilities
   */
  async calculateAccountBalance(accountId: string, userId: string): Promise<Decimal> {
    const transactions = await this.getTransactionsByAccountId(accountId, userId);
    return transactions.reduce((balance, transaction) => {
      return balance.plus(transaction.amount);
    }, new Decimal(0));
  }

  async getUserNetWorth(userId: string): Promise<Decimal> {
    const accounts = await this.getAccountsByUserId(userId);
    return accounts.reduce((netWorth, account) => {
      return netWorth.plus(account.balance);
    }, new Decimal(0));
  }

  /**
   * Private transformation methods
   */
  private transformAccountFromDb(dbAccount: DbAccount): Account {
    return {
      ...dbAccount,
      balance: toDecimalRequired(dbAccount.balance),
      creditLimit: dbAccount.creditLimit ? toDecimal(dbAccount.creditLimit) : null,
    };
  }

  private transformAccountToDb(appAccount: Partial<NewAccount>): DbNewAccount {
    const result: Partial<DbNewAccount> = {};
    
    // Copy non-decimal fields directly
    if (appAccount.id !== undefined) result.id = appAccount.id;
    if (appAccount.name !== undefined) result.name = appAccount.name;
    if (appAccount.type !== undefined) result.type = appAccount.type;
    if (appAccount.userId !== undefined) result.userId = appAccount.userId;
    if (appAccount.isActive !== undefined) result.isActive = appAccount.isActive;
    if (appAccount.createdAt !== undefined) result.createdAt = appAccount.createdAt;
    if (appAccount.updatedAt !== undefined) result.updatedAt = appAccount.updatedAt;
    
    // Transform decimal fields
    if (appAccount.balance !== undefined) {
      result.balance = appAccount.balance ? fromDecimalRequired(appAccount.balance) : '0.00';
    }
    if (appAccount.creditLimit !== undefined) {
      result.creditLimit = appAccount.creditLimit ? fromDecimal(appAccount.creditLimit) : null;
    }
    
    return result as DbNewAccount;
  }

  private transformTransactionFromDb(dbTransaction: DbTransaction): Transaction {
    return {
      ...dbTransaction,
      amount: toDecimalRequired(dbTransaction.amount),
    };
  }

  private transformTransactionToDb(appTransaction: Partial<NewTransaction>): DbNewTransaction {
    const result: Partial<DbNewTransaction> = {};
    
    // Copy non-decimal fields directly
    if (appTransaction.id !== undefined) result.id = appTransaction.id;
    if (appTransaction.userId !== undefined) result.userId = appTransaction.userId;
    if (appTransaction.accountId !== undefined) result.accountId = appTransaction.accountId;
    if (appTransaction.description !== undefined) result.description = appTransaction.description;
    if (appTransaction.categoryId !== undefined) result.categoryId = appTransaction.categoryId;
    if (appTransaction.transactionDate !== undefined) result.transactionDate = appTransaction.transactionDate;
    if (appTransaction.isRecurring !== undefined) result.isRecurring = appTransaction.isRecurring;
    if (appTransaction.recurringPaymentId !== undefined) result.recurringPaymentId = appTransaction.recurringPaymentId;
    if (appTransaction.receiptUrl !== undefined) result.receiptUrl = appTransaction.receiptUrl;
    if (appTransaction.createdAt !== undefined) result.createdAt = appTransaction.createdAt;
    if (appTransaction.updatedAt !== undefined) result.updatedAt = appTransaction.updatedAt;
    
    // Transform decimal fields
    if (appTransaction.amount !== undefined) {
      result.amount = fromDecimalRequired(appTransaction.amount);
    }
    
    return result as DbNewTransaction;
  }

  private transformRecurringPaymentFromDb(dbPayment: DbRecurringPayment): RecurringPayment {
    return {
      ...dbPayment,
      amount: toDecimalRequired(dbPayment.amount),
    };
  }

  private transformRecurringPaymentToDb(appPayment: Partial<NewRecurringPayment>): DbNewRecurringPayment {
    const result: Partial<DbNewRecurringPayment> = {};
    
    // Copy non-decimal fields directly
    if (appPayment.id !== undefined) result.id = appPayment.id;
    if (appPayment.userId !== undefined) result.userId = appPayment.userId;
    if (appPayment.accountId !== undefined) result.accountId = appPayment.accountId;
    if (appPayment.name !== undefined) result.name = appPayment.name;
    if (appPayment.frequency !== undefined) result.frequency = appPayment.frequency;
    if (appPayment.nextDueDate !== undefined) result.nextDueDate = appPayment.nextDueDate;
    if (appPayment.categoryId !== undefined) result.categoryId = appPayment.categoryId;
    if (appPayment.isActive !== undefined) result.isActive = appPayment.isActive;
    if (appPayment.lastProcessed !== undefined) result.lastProcessed = appPayment.lastProcessed;
    if (appPayment.createdAt !== undefined) result.createdAt = appPayment.createdAt;
    if (appPayment.updatedAt !== undefined) result.updatedAt = appPayment.updatedAt;
    
    // Transform decimal fields
    if (appPayment.amount !== undefined) {
      result.amount = fromDecimalRequired(appPayment.amount);
    }
    
    return result as DbNewRecurringPayment;
  }
}

// Singleton instance
export const financialService = new FinancialService();
