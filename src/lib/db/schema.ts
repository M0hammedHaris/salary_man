import { 
  pgTable, 
  text, 
  timestamp, 
  boolean, 
  numeric, 
  pgEnum, 
  json, 
  uuid
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Remove the decimal transformation functions and complex types
// Keep the schema simple and handle decimal conversion in service layer

// Enums
export const accountTypeEnum = pgEnum('account_type', [
  'checking', 
  'savings', 
  'investment', 
  'credit_card', 
  'other'
]);

export const categoryTypeEnum = pgEnum('category_type', [
  'income', 
  'expense'
]);

export const paymentFrequencyEnum = pgEnum('payment_frequency', [
  'weekly', 
  'monthly', 
  'quarterly', 
  'yearly'
]);

// User Preferences Type
export interface UserPreferences {
  currency: string;
  dateFormat: string;
  alertThresholds: {
    creditCard: number;
    lowBalance: number;
  };
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
}

// Users table
export const users = pgTable('users', {
  id: text('id').primaryKey(), // Clerk user ID
  email: text('email').notNull().unique(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  preferences: json('preferences').$type<UserPreferences>().notNull().default({
    currency: 'USD',
    dateFormat: 'MM/dd/yyyy',
    alertThresholds: {
      creditCard: 80,
      lowBalance: 100
    },
    notifications: {
      email: true,
      push: true,
      sms: false
    }
  }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Accounts table
export const accounts = pgTable('accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  type: accountTypeEnum('type').notNull(),
  balance: numeric('balance', { precision: 12, scale: 2 }).notNull().default('0.00'),
  creditLimit: numeric('credit_limit', { precision: 12, scale: 2 }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Categories table
export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  type: categoryTypeEnum('type').notNull(),
  color: text('color').notNull().default('#6366f1'),
  isDefault: boolean('is_default').notNull().default(false),
  parentId: uuid('parent_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Transactions table
export const transactions = pgTable('transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  accountId: uuid('account_id').references(() => accounts.id, { onDelete: 'cascade' }).notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  description: text('description').notNull(),
  categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'restrict' }).notNull(),
  transactionDate: timestamp('transaction_date', { withTimezone: true }).notNull(),
  isRecurring: boolean('is_recurring').notNull().default(false),
  recurringPaymentId: uuid('recurring_payment_id'),
  receiptUrl: text('receipt_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Recurring Payments table
export const recurringPayments = pgTable('recurring_payments', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  accountId: uuid('account_id').references(() => accounts.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  frequency: paymentFrequencyEnum('frequency').notNull(),
  nextDueDate: timestamp('next_due_date', { withTimezone: true }).notNull(),
  categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'restrict' }).notNull(),
  isActive: boolean('is_active').notNull().default(true),
  lastProcessed: timestamp('last_processed', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  categories: many(categories),
  transactions: many(transactions),
  recurringPayments: many(recurringPayments),
}));

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
  transactions: many(transactions),
  recurringPayments: many(recurringPayments),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  user: one(users, {
    fields: [categories.userId],
    references: [users.id],
  }),
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: 'subcategories'
  }),
  subcategories: many(categories, {
    relationName: 'subcategories'
  }),
  transactions: many(transactions),
  recurringPayments: many(recurringPayments),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
  account: one(accounts, {
    fields: [transactions.accountId],
    references: [accounts.id],
  }),
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
}));

export const recurringPaymentsRelations = relations(recurringPayments, ({ one }) => ({
  user: one(users, {
    fields: [recurringPayments.userId],
    references: [users.id],
  }),
  account: one(accounts, {
    fields: [recurringPayments.accountId],
    references: [accounts.id],
  }),
  category: one(categories, {
    fields: [recurringPayments.categoryId],
    references: [categories.id],
  }),
}));

// TypeScript types derived from schema
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type RecurringPayment = typeof recurringPayments.$inferSelect;
export type NewRecurringPayment = typeof recurringPayments.$inferInsert;

// Enum types
export type AccountType = typeof accounts.type.enumValues[number];
export type CategoryType = typeof categories.type.enumValues[number];
export type PaymentFrequency = typeof recurringPayments.frequency.enumValues[number];
