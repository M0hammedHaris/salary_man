import { 
  pgTable, 
  text, 
  timestamp, 
  boolean, 
  numeric, 
  pgEnum, 
  json, 
  uuid,
  index
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

export const billStatusEnum = pgEnum('bill_status', [
  'pending',
  'paid',
  'overdue',
  'cancelled'
]);

export const alertTypeEnum = pgEnum('alert_type', [
  'credit_utilization',
  'low_balance',
  'spending_limit',
  'unusual_activity',
  'bill_reminder_1_day',
  'bill_reminder_3_day',
  'bill_reminder_7_day',
  'bill_reminder_14_day',
  'bill_reminder_overdue',
  'bill_reminder_due_today',
  'insufficient_funds_bill'
]);

export const alertStatusEnum = pgEnum('alert_status', [
  'triggered',
  'acknowledged',
  'dismissed',
  'snoozed'
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
    currency: 'INR',
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
  status: billStatusEnum('status').notNull().default('pending'),
  paymentDate: timestamp('payment_date', { withTimezone: true }),
  reminderDays: text('reminder_days').notNull().default('1,3,7'), // CSV of reminder advance days
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Alert Settings table - stores customizable thresholds per account
export const alertSettings = pgTable('alert_settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  accountId: uuid('account_id').references(() => accounts.id, { onDelete: 'cascade' }).notNull(),
  alertType: alertTypeEnum('alert_type').notNull(),
  thresholdPercentage: numeric('threshold_percentage', { precision: 5, scale: 2 }),
  thresholdAmount: numeric('threshold_amount', { precision: 12, scale: 2 }),
  isEnabled: boolean('is_enabled').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userAccountIdx: index('alert_settings_user_account_idx').on(table.userId, table.accountId),
  typeEnabledIdx: index('alert_settings_type_enabled_idx').on(table.alertType, table.isEnabled),
}));

// Alerts table - tracks alert history and acknowledgments
export const alerts = pgTable('alerts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  accountId: uuid('account_id').references(() => accounts.id, { onDelete: 'cascade' }).notNull(),
  alertType: alertTypeEnum('alert_type').notNull(),
  message: text('message').notNull(),
  currentValue: numeric('current_value', { precision: 12, scale: 2 }).notNull(),
  thresholdValue: numeric('threshold_value', { precision: 12, scale: 2 }).notNull(),
  status: alertStatusEnum('status').notNull().default('triggered'),
  triggeredAt: timestamp('triggered_at', { withTimezone: true }).defaultNow().notNull(),
  acknowledgedAt: timestamp('acknowledged_at', { withTimezone: true }),
  snoozeUntil: timestamp('snooze_until', { withTimezone: true }),
  // Notification center extensions
  deliveryChannels: text('delivery_channels').array().default(['inApp']),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),
  deliveryStatus: text('delivery_status').default('pending'),
  priority: text('priority').default('medium'),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
  readAt: timestamp('read_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userTriggeredIdx: index('alerts_user_triggered_idx').on(table.userId, table.triggeredAt),
  accountStatusIdx: index('alerts_account_status_idx').on(table.accountId, table.status),
  statusTriggeredIdx: index('alerts_status_triggered_idx').on(table.status, table.triggeredAt),
  deliveryStatusIdx: index('alerts_delivery_status_idx').on(table.deliveryStatus, table.deliveredAt),
  priorityTriggeredIdx: index('alerts_priority_triggered_idx').on(table.priority, table.triggeredAt),
  readArchivedIdx: index('alerts_read_archived_idx').on(table.readAt, table.archivedAt),
}));

// Notification Preferences table - user notification settings per alert type
export const notificationPreferences = pgTable('notification_preferences', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  alertType: text('alert_type').notNull(),
  emailEnabled: boolean('email_enabled').default(true),
  pushEnabled: boolean('push_enabled').default(true),
  inAppEnabled: boolean('in_app_enabled').default(true),
  smsEnabled: boolean('sms_enabled').default(false),
  frequencyLimit: numeric('frequency_limit', { precision: 10, scale: 0 }), // Max notifications per day for this type
  quietHoursStart: text('quiet_hours_start'), // Store as time string
  quietHoursEnd: text('quiet_hours_end'), // Store as time string
  timezone: text('timezone').default('UTC'),
  emergencyOverride: boolean('emergency_override').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userTypeIdx: index('notification_preferences_user_type_idx').on(table.userId, table.alertType),
  uniqueUserType: index('notification_preferences_unique_user_type').on(table.userId, table.alertType),
}));

// Notification History table - tracks all notification deliveries
export const notificationHistory = pgTable('notification_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  alertId: uuid('alert_id').references(() => alerts.id, { onDelete: 'cascade' }),
  notificationType: text('notification_type').notNull(),
  channel: text('channel').notNull(), // email, push, inApp, sms
  title: text('title').notNull(),
  message: text('message').notNull(),
  status: text('status').default('sent'), // sent, delivered, failed, read
  sentAt: timestamp('sent_at', { withTimezone: true }).defaultNow().notNull(),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),
  readAt: timestamp('read_at', { withTimezone: true }),
  metadata: json('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userSentIdx: index('notification_history_user_sent_idx').on(table.userId, table.sentAt),
  alertIdx: index('notification_history_alert_idx').on(table.alertId),
  channelStatusIdx: index('notification_history_channel_status_idx').on(table.channel, table.status),
}));

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  categories: many(categories),
  transactions: many(transactions),
  recurringPayments: many(recurringPayments),
  alerts: many(alerts),
  alertSettings: many(alertSettings),
  notificationPreferences: many(notificationPreferences),
  notificationHistory: many(notificationHistory),
}));

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
  transactions: many(transactions),
  recurringPayments: many(recurringPayments),
  alerts: many(alerts),
  alertSettings: many(alertSettings),
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

export const alertsRelations = relations(alerts, ({ one, many }) => ({
  user: one(users, {
    fields: [alerts.userId],
    references: [users.id],
  }),
  account: one(accounts, {
    fields: [alerts.accountId],
    references: [accounts.id],
  }),
  notificationHistory: many(notificationHistory),
}));

export const alertSettingsRelations = relations(alertSettings, ({ one }) => ({
  user: one(users, {
    fields: [alertSettings.userId],
    references: [users.id],
  }),
  account: one(accounts, {
    fields: [alertSettings.accountId],
    references: [accounts.id],
  }),
}));

export const notificationPreferencesRelations = relations(notificationPreferences, ({ one }) => ({
  user: one(users, {
    fields: [notificationPreferences.userId],
    references: [users.id],
  }),
}));

export const notificationHistoryRelations = relations(notificationHistory, ({ one }) => ({
  user: one(users, {
    fields: [notificationHistory.userId],
    references: [users.id],
  }),
  alert: one(alerts, {
    fields: [notificationHistory.alertId],
    references: [alerts.id],
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
export type Alert = typeof alerts.$inferSelect;
export type NewAlert = typeof alerts.$inferInsert;
export type AlertSettings = typeof alertSettings.$inferSelect;
export type NewAlertSettings = typeof alertSettings.$inferInsert;
export type NotificationPreferences = typeof notificationPreferences.$inferSelect;
export type NewNotificationPreferences = typeof notificationPreferences.$inferInsert;
export type NotificationHistory = typeof notificationHistory.$inferSelect;
export type NewNotificationHistory = typeof notificationHistory.$inferInsert;

// Enum types
export type AccountType = typeof accounts.type.enumValues[number];
export type CategoryType = typeof categories.type.enumValues[number];
export type PaymentFrequency = typeof recurringPayments.frequency.enumValues[number];
// Temporarily commented out until migration is applied:
export type BillStatus = typeof recurringPayments.status.enumValues[number];
export type AlertType = typeof alerts.alertType.enumValues[number];
export type AlertStatus = typeof alerts.status.enumValues[number];
