import { z } from 'zod';
import Decimal from 'decimal.js';
import { eq, and, gte, desc, lte, lt } from 'drizzle-orm';
import { addDays, differenceInDays, startOfDay } from 'date-fns';
import { db } from '../db';
import { 
  recurringPayments, 
  alerts, 
  accounts,
  type RecurringPayment, 
  type Alert, 
  type Account,
  type BillStatus,
  type AlertType,
  type Transaction
} from '../db/schema';
import { adjustToBusinessDay, type BusinessDayConfig } from '../utils/business-day-utils';
import { BillNotificationService } from './bill-notification-service';

// Validation schemas
export const billReminderCreateSchema = z.object({
  userId: z.string(),
  accountId: z.string(),
  name: z.string().min(1, 'Bill name is required'),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid amount format'),
  frequency: z.enum(['weekly', 'monthly', 'quarterly', 'yearly']),
  nextDueDate: z.string().datetime(),
  categoryId: z.string(),
  reminderDays: z.string().default('1,3,7'), // CSV of reminder days
});

export const billPaymentConfirmationSchema = z.object({
  billId: z.string(),
  userId: z.string(),
  paymentDate: z.string().datetime().optional(),
  transactionId: z.string().optional(),
});

export const billReminderSettingsSchema = z.object({
  billId: z.string(),
  userId: z.string(),
  reminderDays: z.string(), // CSV of reminder days (e.g., "1,3,7,14")
  notificationChannels: z.object({
    email: z.boolean().default(true),
    push: z.boolean().default(true),
    sms: z.boolean().default(false),
  }).default({ email: true, push: true, sms: false }),
});

// Types
export interface BillReminderData {
  billId: string;
  billName: string;
  amount: Decimal;
  dueDate: Date;
  accountId: string;
  accountName: string;
  daysUntilDue: number;
  isOverdue: boolean;
  reminderType: 'bill_reminder_1_day' | 'bill_reminder_3_day' | 'bill_reminder_7_day' | 'bill_reminder_14_day';
}

export interface BillReminder {
  bill: RecurringPayment;
  account: Account;
  daysUntilDue: number;
  reminderType: AlertType;
  message: string;
  isOverdue: boolean;
}

export interface InsufficientFundsWarning {
  billId: string;
  billName: string;
  amount: Decimal;
  dueDate: Date;
  accountBalance: Decimal;
  shortfall: Decimal;
  accountId: string; // Add accountId for easier access
}

export interface BillProcessingResult {
  processedBills: number;
  triggeredReminders: number;
  createdAlerts: Alert[];
  insufficientFundsWarnings: InsufficientFundsWarning[];
}

// Constants
export const DEFAULT_REMINDER_DAYS = [1, 3, 7, 14];
export const BILL_REMINDER_TYPES: Record<number, AlertType> = {
  1: 'bill_reminder_1_day',
  3: 'bill_reminder_3_day',
  7: 'bill_reminder_7_day',
  14: 'bill_reminder_14_day',
};

/**
 * Bill Service for managing bill reminders, payment tracking, and notifications
 */
export class BillService {
  
  /**
   * Calculate the next due date based on frequency
   */
  static calculateNextDueDate(currentDueDate: Date, frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly'): Date {
    const baseDate = new Date(currentDueDate);
    
    switch (frequency) {
      case 'weekly':
        return addDays(baseDate, 7);
      case 'monthly':
        return new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, baseDate.getDate());
      case 'quarterly':
        return new Date(baseDate.getFullYear(), baseDate.getMonth() + 3, baseDate.getDate());
      case 'yearly':
        return new Date(baseDate.getFullYear() + 1, baseDate.getMonth(), baseDate.getDate());
      default:
        throw new Error(`Unsupported frequency: ${frequency}`);
    }
  }

  /**
   * Parse reminder days from CSV string
   */
  static parseReminderDays(reminderDaysStr: string): number[] {
    return reminderDaysStr
      .split(',')
      .map(day => parseInt(day.trim(), 10))
      .filter(day => !isNaN(day) && day > 0)
      .sort((a, b) => a - b);
  }

  /**
   * Get upcoming bills that need reminders
   */
  static async getUpcomingBillsForReminders(userId: string, lookaheadDays: number = 14): Promise<BillReminder[]> {
    const today = startOfDay(new Date());
    const futureDate = addDays(today, lookaheadDays);
    
    // Get active bills due within the lookahead period
    const upcomingBills = await db
      .select({
        bill: recurringPayments,
        account: accounts,
      })
      .from(recurringPayments)
      .innerJoin(accounts, eq(recurringPayments.accountId, accounts.id))
      .where(
        and(
          eq(recurringPayments.userId, userId),
          eq(recurringPayments.isActive, true),
          gte(recurringPayments.nextDueDate, today),
          lte(recurringPayments.nextDueDate, futureDate)
        )
      );

    const billReminders: BillReminder[] = [];

    for (const { bill, account } of upcomingBills) {
      const dueDate = new Date(bill.nextDueDate);
      const daysUntilDue = differenceInDays(dueDate, today);
      const reminderDays = this.parseReminderDays(bill.reminderDays);
      
      // Check if we should send a reminder for this bill
      for (const reminderDay of reminderDays) {
        if (daysUntilDue === reminderDay) {
          const reminderType = BILL_REMINDER_TYPES[reminderDay];
          if (reminderType) {
            billReminders.push({
              bill,
              account,
              daysUntilDue,
              reminderType,
              message: this.generateReminderMessage(bill, account, daysUntilDue),
              isOverdue: daysUntilDue < 0,
            });
          }
        }
      }
    }

    return billReminders;
  }

  /**
   * Get overdue bills
   */
  static async getOverdueBills(userId: string): Promise<BillReminder[]> {
    const today = startOfDay(new Date());
    
    const overdueBills = await db
      .select({
        bill: recurringPayments,
        account: accounts,
      })
      .from(recurringPayments)
      .innerJoin(accounts, eq(recurringPayments.accountId, accounts.id))
      .where(
        and(
          eq(recurringPayments.userId, userId),
          eq(recurringPayments.isActive, true),
          lt(recurringPayments.nextDueDate, today),
          eq(recurringPayments.status, 'pending')
        )
      );

    return overdueBills.map(({ bill, account }) => {
      const dueDate = new Date(bill.nextDueDate);
      const daysOverdue = Math.abs(differenceInDays(today, dueDate));
      
      return {
        bill,
        account,
        daysUntilDue: -daysOverdue,
        reminderType: 'bill_reminder_1_day' as AlertType,
        message: `${bill.name} is ${daysOverdue} day(s) overdue. Amount: ₹${bill.amount}`,
        isOverdue: true,
      };
    });
  }

  /**
   * Check for insufficient funds for upcoming bills
   */
  static async checkInsufficientFunds(userId: string, lookaheadDays: number = 7): Promise<InsufficientFundsWarning[]> {
    const today = startOfDay(new Date());
    const futureDate = addDays(today, lookaheadDays);
    
    const upcomingBills = await db
      .select({
        bill: recurringPayments,
        account: accounts,
      })
      .from(recurringPayments)
      .innerJoin(accounts, eq(recurringPayments.accountId, accounts.id))
      .where(
        and(
          eq(recurringPayments.userId, userId),
          eq(recurringPayments.isActive, true),
          gte(recurringPayments.nextDueDate, today),
          lte(recurringPayments.nextDueDate, futureDate),
          eq(recurringPayments.status, 'pending')
        )
      );

    const warnings: InsufficientFundsWarning[] = [];

    for (const { bill, account } of upcomingBills) {
      const billAmount = new Decimal(bill.amount);
      const accountBalance = new Decimal(account.balance);
      
      // For credit cards, check against available credit
      if (account.type === 'credit_card' && account.creditLimit) {
        const creditLimit = new Decimal(account.creditLimit);
        const availableCredit = creditLimit.plus(accountBalance); // balance is negative for credit cards
        
        if (billAmount.gt(availableCredit)) {
          warnings.push({
            billId: bill.id,
            billName: bill.name,
            amount: billAmount,
            dueDate: new Date(bill.nextDueDate),
            accountBalance: availableCredit,
            shortfall: billAmount.minus(availableCredit),
            accountId: account.id,
          });
        }
      } else {
        // For regular accounts, check against account balance
        if (billAmount.gt(accountBalance)) {
          warnings.push({
            billId: bill.id,
            billName: bill.name,
            amount: billAmount,
            dueDate: new Date(bill.nextDueDate),
            accountBalance,
            shortfall: billAmount.minus(accountBalance),
            accountId: account.id,
          });
        }
      }
    }

    return warnings;
  }

  /**
   * Generate reminder message for a bill
   */
  static generateReminderMessage(bill: RecurringPayment, account: Account, daysUntilDue: number): string {
    const amount = new Decimal(bill.amount);
    
    if (daysUntilDue === 0) {
      return `${bill.name} is due today. Amount: ₹${amount.toFixed(2)} from ${account.name}`;
    } else if (daysUntilDue === 1) {
      return `${bill.name} is due tomorrow. Amount: ₹${amount.toFixed(2)} from ${account.name}`;
    } else if (daysUntilDue > 1) {
      return `${bill.name} is due in ${daysUntilDue} days. Amount: ₹${amount.toFixed(2)} from ${account.name}`;
    } else {
      const daysOverdue = Math.abs(daysUntilDue);
      return `${bill.name} is ${daysOverdue} day(s) overdue. Amount: ₹${amount.toFixed(2)} from ${account.name}`;
    }
  }

  /**
   * Process daily bill reminders (to be called by cron job)
   */
  static async processDailyBillReminders(): Promise<BillProcessingResult> {
    const result: BillProcessingResult = {
      processedBills: 0,
      triggeredReminders: 0,
      createdAlerts: [],
      insufficientFundsWarnings: [],
    };

    try {
      // Get all users with active bills
      const usersWithBills = await db
        .selectDistinct({ userId: recurringPayments.userId })
        .from(recurringPayments)
        .where(eq(recurringPayments.isActive, true));

      for (const { userId } of usersWithBills) {
        // Get upcoming bill reminders for this user
        const billReminders = await this.getUpcomingBillsForReminders(userId);
        result.processedBills += billReminders.length;

        // Create alerts for each reminder
        for (const reminder of billReminders) {
          // Check spam prevention (reuse existing alert service logic)
          const shouldPrevent = await this.checkReminderSpamPrevention(
            userId,
            reminder.bill.accountId,
            reminder.reminderType
          );

          if (!shouldPrevent) {
            const alert = await this.createBillReminderAlert(userId, reminder);
            result.createdAlerts.push(alert);
            result.triggeredReminders++;

            // Send multi-channel notification for the bill reminder
            try {
              const notificationChannels = await BillNotificationService.getBillNotificationPreferences(
                userId, 
                reminder.bill.id
              );
              await BillNotificationService.sendBillReminderNotification(reminder, notificationChannels);
            } catch (notificationError) {
              console.error('Failed to send bill reminder notification:', notificationError);
              // Don't fail the entire process if notification fails
            }
          }
        }

        // Check for insufficient funds warnings
        const fundsWarnings = await this.checkInsufficientFunds(userId);
        result.insufficientFundsWarnings.push(...fundsWarnings);

        // Send insufficient funds notifications
        for (const warning of fundsWarnings) {
          try {
            const billAccount = await db
              .select()
              .from(accounts)
              .where(eq(accounts.id, warning.accountId))
              .limit(1);

            const bill = await db
              .select()
              .from(recurringPayments)
              .where(eq(recurringPayments.id, warning.billId))
              .limit(1);

            if (billAccount.length > 0 && bill.length > 0) {
              const notificationChannels = await BillNotificationService.getBillNotificationPreferences(
                userId,
                warning.billId
              );
              await BillNotificationService.sendInsufficientFundsNotification(
                userId,
                bill[0],
                billAccount[0],
                warning.shortfall.toString(),
                notificationChannels
              );
            }
          } catch (notificationError) {
            console.error('Failed to send insufficient funds notification:', notificationError);
            // Don't fail the entire process if notification fails
          }
        }

        // Update overdue bill status
        await this.updateOverdueBillStatus(userId);
      }

      return result;
    } catch (error) {
      console.error('Error processing daily bill reminders:', error);
      throw error;
    }
  }

  /**
   * Create a bill reminder alert
   */
  static async createBillReminderAlert(userId: string, reminder: BillReminder): Promise<Alert> {
    const alert = await db
      .insert(alerts)
      .values({
        userId,
        accountId: reminder.account.id,
        alertType: reminder.reminderType,
        message: reminder.message,
        currentValue: reminder.daysUntilDue.toString(),
        thresholdValue: reminder.daysUntilDue.toString(),
        status: 'triggered',
      })
      .returning();

    return alert[0];
  }

  /**
   * Check spam prevention for bill reminders
   */
  static async checkReminderSpamPrevention(
    userId: string,
    accountId: string,
    alertType: AlertType,
    intervalHours: number = 23 // Prevent multiple reminders for same bill within 23 hours
  ): Promise<boolean> {
    const now = new Date();
    const intervalStart = new Date(now.getTime() - intervalHours * 60 * 60 * 1000);

    const recentAlerts = await db
      .select()
      .from(alerts)
      .where(
        and(
          eq(alerts.userId, userId),
          eq(alerts.accountId, accountId),
          eq(alerts.alertType, alertType),
          gte(alerts.triggeredAt, intervalStart)
        )
      )
      .limit(1);

    return recentAlerts.length > 0;
  }

  /**
   * Mark bill as paid and send confirmation notification
   */
  static async markBillAsPaid(
    billId: string,
    userId: string,
    paymentDate?: Date,
    sendNotification: boolean = true
  ): Promise<RecurringPayment | null> {
    const paymentTimestamp = paymentDate || new Date();
    
    // Get the bill and account information for notifications
    const billWithAccount = await db
      .select({
        bill: recurringPayments,
        account: accounts,
      })
      .from(recurringPayments)
      .innerJoin(accounts, eq(recurringPayments.accountId, accounts.id))
      .where(
        and(
          eq(recurringPayments.id, billId),
          eq(recurringPayments.userId, userId)
        )
      )
      .limit(1);

    if (billWithAccount.length === 0) {
      return null;
    }

    const { bill, account } = billWithAccount[0];
    const nextDueDate = this.calculateNextDueDate(new Date(bill.nextDueDate), bill.frequency);

    // Update bill status and calculate next due date
    const updatedBill = await db
      .update(recurringPayments)
      .set({
        status: 'paid',
        paymentDate: paymentTimestamp,
        lastProcessed: paymentTimestamp,
        nextDueDate,
        updatedAt: new Date(),
      })
      .where(eq(recurringPayments.id, billId))
      .returning();

    const resultBill = updatedBill.length > 0 ? updatedBill[0] : null;

    // Send payment confirmation notification
    if (sendNotification && resultBill) {
      try {
        const notificationChannels = await BillNotificationService.getBillNotificationPreferences(
          userId,
          billId
        );
        await BillNotificationService.sendPaymentConfirmationNotification(
          userId,
          resultBill,
          account,
          bill.amount,
          notificationChannels
        );
      } catch (notificationError) {
        console.error('Failed to send payment confirmation notification:', notificationError);
        // Don't fail the payment confirmation if notification fails
      }
    }

    return resultBill;
  }

  /**
   * Automatically detect bill payments from recent transactions
   * This method checks for transactions that match pending bill amounts and dates
   */
  static async detectBillPayments(userId: string, lookbackDays: number = 3): Promise<RecurringPayment[]> {
    const lookbackDate = addDays(new Date(), -lookbackDays);
    const detectedPayments: RecurringPayment[] = [];

    // Get all pending bills for the user
    const pendingBills = await db
      .select()
      .from(recurringPayments)
      .where(
        and(
          eq(recurringPayments.userId, userId),
          eq(recurringPayments.isActive, true),
          eq(recurringPayments.status, 'pending')
        )
      );

    // Get recent transactions that could be bill payments
    const { transactions } = await import('../db/schema');
    const recentTransactions = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          gte(transactions.transactionDate, lookbackDate)
        )
      );

    // Match transactions to bills based on amount and account
    for (const bill of pendingBills) {
      const billAmount = new Decimal(bill.amount);
      
      for (const transaction of recentTransactions) {
        const transactionAmount = new Decimal(transaction.amount).abs(); // Use absolute value
        
        // Check if transaction matches bill criteria:
        // 1. Same account
        // 2. Same or very close amount (within 1%)
        // 3. Transaction is negative (payment/expense)
        if (
          transaction.accountId === bill.accountId &&
          transactionAmount.equals(billAmount) &&
          new Decimal(transaction.amount).isNegative() &&
          !transaction.recurringPaymentId // Not already linked to a bill
        ) {
          // Mark the bill as paid and link the transaction
          const paidBill = await this.markBillAsPaid(
            bill.id,
            userId,
            new Date(transaction.transactionDate),
            true // Send notification
          );

          if (paidBill) {
            // Link the transaction to the recurring payment
            await db
              .update(transactions)
              .set({
                recurringPaymentId: bill.id,
                updatedAt: new Date(),
              })
              .where(eq(transactions.id, transaction.id));

            detectedPayments.push(paidBill);
          }
          
          break; // One transaction per bill
        }
      }
    }

    return detectedPayments;
  }

  /**
   * Get payment history for a specific bill
   */
  static async getBillPaymentHistory(
    billId: string,
    userId: string,
    limit: number = 12
  ): Promise<Array<{ bill: RecurringPayment; transaction?: Transaction }>> {
    // Get the bill payments (status = 'paid')
    const paidBills = await db
      .select()
      .from(recurringPayments)
      .where(
        and(
          eq(recurringPayments.id, billId),
          eq(recurringPayments.userId, userId),
          eq(recurringPayments.status, 'paid')
        )
      )
      .orderBy(desc(recurringPayments.paymentDate))
      .limit(limit);

    // Get linked transactions for these payments
    const { transactions } = await import('../db/schema');
    const paymentHistory = [];

    for (const bill of paidBills) {
      const linkedTransaction = await db
        .select()
        .from(transactions)
        .where(eq(transactions.recurringPaymentId, bill.id))
        .limit(1);

      paymentHistory.push({
        bill,
        transaction: linkedTransaction.length > 0 ? linkedTransaction[0] : undefined,
      });
    }

    return paymentHistory;
  }

  /**
   * Create a transaction when marking a bill as paid (for manual payments)
   */
  static async createPaymentTransaction(
    billId: string,
    userId: string,
    amount: string,
    accountId: string,
    categoryId: string,
    description?: string
  ): Promise<Transaction> {
    const { transactions } = await import('../db/schema');
    
    const transaction = await db
      .insert(transactions)
      .values({
        userId,
        accountId,
        amount: `-${amount}`, // Negative for payment/expense
        description: description || `Payment for bill`,
        categoryId,
        transactionDate: new Date(),
        isRecurring: true,
        recurringPaymentId: billId,
      })
      .returning();

    return transaction[0];
  }

  /**
   * Update overdue bill status
   */
  static async updateOverdueBillStatus(userId: string): Promise<number> {
    const today = startOfDay(new Date());
    
    const result = await db
      .update(recurringPayments)
      .set({
        status: 'overdue',
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(recurringPayments.userId, userId),
          eq(recurringPayments.isActive, true),
          eq(recurringPayments.status, 'pending'),
          lt(recurringPayments.nextDueDate, today)
        )
      );

    return result.rowCount || 0;
  }

  /**
   * Create or update bill reminder settings
   */
  static async upsertBillReminderSettings(
    billId: string,
    userId: string,
    reminderDays: number[]
  ): Promise<RecurringPayment | null> {
    const reminderDaysStr = reminderDays.join(',');
    
    const updated = await db
      .update(recurringPayments)
      .set({
        reminderDays: reminderDaysStr,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(recurringPayments.id, billId),
          eq(recurringPayments.userId, userId)
        )
      )
      .returning();

    return updated.length > 0 ? updated[0] : null;
  }

  /**
   * Get user's bills with optional filtering
   */
  static async getUserBills(
    userId: string,
    options: {
      status?: BillStatus;
      accountId?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<Array<RecurringPayment & { account: Account }>> {
    const { status, accountId, limit = 50, offset = 0 } = options;

    const whereConditions = [eq(recurringPayments.userId, userId)];
    
    if (status) {
      whereConditions.push(eq(recurringPayments.status, status));
    }
    
    if (accountId) {
      whereConditions.push(eq(recurringPayments.accountId, accountId));
    }

    const results = await db
      .select({
        bill: recurringPayments,
        account: accounts,
      })
      .from(recurringPayments)
      .innerJoin(accounts, eq(recurringPayments.accountId, accounts.id))
      .where(and(...whereConditions))
      .orderBy(desc(recurringPayments.nextDueDate))
      .limit(limit)
      .offset(offset);

    return results.map(({ bill, account }) => ({ ...bill, account }));
  }

  /**
   * Get dashboard summary of upcoming bills
   */
  static async getBillDashboardSummary(userId: string): Promise<{
    upcomingBills: number;
    overdueBills: number;
    totalAmountDue: Decimal;
    nextBillDue?: {
      name: string;
      amount: Decimal;
      dueDate: Date;
      daysUntilDue: number;
    };
  }> {
    const today = startOfDay(new Date());
    const nextWeek = addDays(today, 7);

    // Get upcoming bills (next 7 days)
    const upcomingBills = await db
      .select()
      .from(recurringPayments)
      .where(
        and(
          eq(recurringPayments.userId, userId),
          eq(recurringPayments.isActive, true),
          eq(recurringPayments.status, 'pending'),
          gte(recurringPayments.nextDueDate, today),
          lte(recurringPayments.nextDueDate, nextWeek)
        )
      );

    // Get overdue bills
    const overdueBills = await db
      .select()
      .from(recurringPayments)
      .where(
        and(
          eq(recurringPayments.userId, userId),
          eq(recurringPayments.isActive, true),
          eq(recurringPayments.status, 'pending'),
          lt(recurringPayments.nextDueDate, today)
        )
      );

    // Calculate total amount due
    const totalAmountDue = [...upcomingBills, ...overdueBills]
      .reduce((sum, bill) => sum.plus(new Decimal(bill.amount)), new Decimal(0));

    // Find next bill due
    const nextBill = upcomingBills
      .sort((a, b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime())[0];

    return {
      upcomingBills: upcomingBills.length,
      overdueBills: overdueBills.length,
      totalAmountDue,
      nextBillDue: nextBill ? {
        name: nextBill.name,
        amount: new Decimal(nextBill.amount),
        dueDate: new Date(nextBill.nextDueDate),
        daysUntilDue: differenceInDays(new Date(nextBill.nextDueDate), today),
      } : undefined,
    };
  }

  /**
   * Adjust bill due dates for business days
   */
  static async adjustBillDueDatesForBusinessDays(
    userId: string,
    config: BusinessDayConfig = {}
  ): Promise<number> {
    const bills = await db
      .select()
      .from(recurringPayments)
      .where(
        and(
          eq(recurringPayments.userId, userId),
          eq(recurringPayments.isActive, true)
        )
      );

    let adjustedCount = 0;

    for (const bill of bills) {
      const originalDueDate = new Date(bill.nextDueDate);
      const adjustedDueDate = adjustToBusinessDay(originalDueDate, config);

      if (adjustedDueDate.getTime() !== originalDueDate.getTime()) {
        await db
          .update(recurringPayments)
          .set({
            nextDueDate: adjustedDueDate,
            updatedAt: new Date(),
          })
          .where(eq(recurringPayments.id, bill.id));

        adjustedCount++;
      }
    }

    return adjustedCount;
  }
}
