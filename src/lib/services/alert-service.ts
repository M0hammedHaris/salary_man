import { z } from 'zod';
import Decimal from 'decimal.js';
import { eq, and, gte, desc } from 'drizzle-orm';
import { db } from '../db';
import { accounts, alerts, alertSettings, type Alert, type AlertSettings, type Account } from '../db/schema';

// Validation schemas
export const alertThresholdSchema = z.object({
  percentage: z.number().min(0).max(100).optional(),
  amount: z.number().min(0).optional(),
}).refine(data => data.percentage !== undefined || data.amount !== undefined, {
  message: "Either percentage or amount threshold must be provided"
});

export const alertSettingsCreateSchema = z.object({
  userId: z.string(),
  accountId: z.string(),
  alertType: z.enum(['credit_utilization', 'low_balance', 'spending_limit', 'unusual_activity']),
  thresholdPercentage: z.string().optional(),
  thresholdAmount: z.string().optional(),
  isEnabled: z.boolean().default(true),
});

// Types
export interface CreditUtilizationData {
  accountId: string;
  currentBalance: Decimal;
  creditLimit: Decimal;
  utilizationPercentage: Decimal;
  utilizationAmount: Decimal;
}

export interface AlertTriggerResult {
  shouldAlert: boolean;
  alertType: 'credit_utilization' | 'low_balance' | 'spending_limit' | 'unusual_activity';
  message: string;
  currentValue: Decimal;
  thresholdValue: Decimal;
  thresholdType: 'percentage' | 'amount';
}

export interface SpamPreventionConfig {
  minIntervalMinutes: number;
  maxAlertsPerDay: number;
}

// Constants for default thresholds and spam prevention
export const DEFAULT_CREDIT_THRESHOLDS = [30, 50, 70, 90]; // Default percentage thresholds
export const DEFAULT_SPAM_PREVENTION: SpamPreventionConfig = {
  minIntervalMinutes: 60, // 1 hour minimum between similar alerts
  maxAlertsPerDay: 10, // Maximum 10 alerts per day per account
};

/**
 * Alert Service for managing credit card utilization alerts and other financial alerts
 */
export class AlertService {
  
  /**
   * Calculate credit utilization data for an account
   */
  static calculateCreditUtilization(account: Account): CreditUtilizationData | null {
    if (account.type !== 'credit_card' || !account.creditLimit) {
      return null;
    }

    const currentBalance = new Decimal(account.balance);
    const creditLimit = new Decimal(account.creditLimit);
    
    // For credit cards, balance is typically negative indicating debt
    // Utilization = abs(balance) / creditLimit * 100
    const utilizationAmount = currentBalance.abs();
    const utilizationPercentage = utilizationAmount.dividedBy(creditLimit).mul(100);

    return {
      accountId: account.id,
      currentBalance,
      creditLimit,
      utilizationPercentage,
      utilizationAmount,
    };
  }

  /**
   * Check if credit utilization should trigger an alert based on thresholds
   */
  static async checkCreditUtilizationAlert(
    userId: string,
    utilizationData: CreditUtilizationData
  ): Promise<AlertTriggerResult[]> {
    const alerts: AlertTriggerResult[] = [];

    // Get custom alert settings for this account
    const customSettings = await db
      .select()
      .from(alertSettings)
      .where(
        and(
          eq(alertSettings.userId, userId),
          eq(alertSettings.accountId, utilizationData.accountId),
          eq(alertSettings.alertType, 'credit_utilization'),
          eq(alertSettings.isEnabled, true)
        )
      );

    // Use custom settings if available, otherwise use defaults
    const thresholds = customSettings.length > 0 
      ? customSettings 
      : DEFAULT_CREDIT_THRESHOLDS.map(threshold => ({
          thresholdPercentage: threshold.toString(),
          thresholdAmount: null,
          alertType: 'credit_utilization' as const,
        }));

    for (const setting of thresholds) {
      if (setting.thresholdPercentage) {
        const thresholdPercentage = new Decimal(setting.thresholdPercentage);
        
        if (utilizationData.utilizationPercentage.gte(thresholdPercentage)) {
          alerts.push({
            shouldAlert: true,
            alertType: 'credit_utilization',
            message: `Credit utilization has reached ${utilizationData.utilizationPercentage.toFixed(1)}% of your ${utilizationData.creditLimit.toFixed(2)} limit`,
            currentValue: utilizationData.utilizationPercentage,
            thresholdValue: thresholdPercentage,
            thresholdType: 'percentage',
          });
        }
      }

      if (setting.thresholdAmount) {
        const thresholdAmount = new Decimal(setting.thresholdAmount);
        
        if (utilizationData.utilizationAmount.gte(thresholdAmount)) {
          alerts.push({
            shouldAlert: true,
            alertType: 'credit_utilization',
            message: `Credit usage has reached ₹${utilizationData.utilizationAmount.toFixed(2)} of your ₹${utilizationData.creditLimit.toFixed(2)} limit`,
            currentValue: utilizationData.utilizationAmount,
            thresholdValue: thresholdAmount,
            thresholdType: 'amount',
          });
        }
      }
    }

    return alerts;
  }

  /**
   * Check if alert should be prevented due to spam protection
   */
  static async checkSpamPrevention(
    userId: string,
    accountId: string,
    alertType: 'credit_utilization' | 'low_balance' | 'spending_limit' | 'unusual_activity',
    config: SpamPreventionConfig = DEFAULT_SPAM_PREVENTION
  ): Promise<boolean> {
    const now = new Date();
    const intervalStart = new Date(now.getTime() - config.minIntervalMinutes * 60 * 1000);
    const dayStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Check for recent similar alerts (within minimum interval)
    const recentSimilarAlerts = await db
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

    if (recentSimilarAlerts.length > 0) {
      return true; // Prevent: too soon since last similar alert
    }

    // Check daily alert limit
    const dailyAlerts = await db
      .select()
      .from(alerts)
      .where(
        and(
          eq(alerts.userId, userId),
          eq(alerts.accountId, accountId),
          gte(alerts.triggeredAt, dayStart)
        )
      );

    if (dailyAlerts.length >= config.maxAlertsPerDay) {
      return true; // Prevent: daily limit reached
    }

    return false; // Allow alert
  }

  /**
   * Create a new alert in the database
   */
  static async createAlert(
    userId: string,
    accountId: string,
    alertData: AlertTriggerResult
  ): Promise<Alert> {
    const alertRecord = await db
      .insert(alerts)
      .values({
        userId,
        accountId,
        alertType: alertData.alertType,
        message: alertData.message,
        currentValue: alertData.currentValue.toString(),
        thresholdValue: alertData.thresholdValue.toString(),
        status: 'triggered',
      })
      .returning();

    return alertRecord[0];
  }

  /**
   * Process alerts for a credit card account after a transaction
   */
  static async processAccountAlerts(userId: string, accountId: string): Promise<Alert[]> {
    // Get account data
    const account = await db
      .select()
      .from(accounts)
      .where(eq(accounts.id, accountId))
      .limit(1);

    if (account.length === 0) {
      throw new Error(`Account ${accountId} not found`);
    }

    const accountData = account[0];
    const createdAlerts: Alert[] = [];

    // Process credit utilization alerts for credit cards
    if (accountData.type === 'credit_card') {
      const utilizationData = this.calculateCreditUtilization(accountData);
      
      if (utilizationData) {
        const potentialAlerts = await this.checkCreditUtilizationAlert(userId, utilizationData);
        
        for (const alertData of potentialAlerts) {
          if (alertData.shouldAlert) {
            // Check spam prevention
            const shouldPrevent = await this.checkSpamPrevention(
              userId,
              accountId,
              alertData.alertType
            );

            if (!shouldPrevent) {
              const createdAlert = await this.createAlert(userId, accountId, alertData);
              createdAlerts.push(createdAlert);
            }
          }
        }
      }
    }

    return createdAlerts;
  }

  /**
   * Get alert history for a user
   */
  static async getAlertHistory(
    userId: string,
    options: {
      accountId?: string;
      status?: 'triggered' | 'acknowledged' | 'snoozed' | 'dismissed';
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<Alert[]> {
    const { accountId, status, limit = 50, offset = 0 } = options;

    const whereConditions = [eq(alerts.userId, userId)];
    
    if (accountId) {
      whereConditions.push(eq(alerts.accountId, accountId));
    }
    
    if (status) {
      whereConditions.push(eq(alerts.status, status));
    }

    const query = db
      .select()
      .from(alerts)
      .where(and(...whereConditions))
      .orderBy(desc(alerts.triggeredAt))
      .limit(limit)
      .offset(offset);

    return await query;
  }

  /**
   * Acknowledge an alert
   */
  static async acknowledgeAlert(alertId: string, userId: string): Promise<Alert | null> {
    const now = new Date();
    
    const updatedAlert = await db
      .update(alerts)
      .set({
        status: 'acknowledged',
        acknowledgedAt: now,
        updatedAt: now,
      })
      .where(
        and(
          eq(alerts.id, alertId),
          eq(alerts.userId, userId)
        )
      )
      .returning();

    return updatedAlert.length > 0 ? updatedAlert[0] : null;
  }

  /**
   * Snooze an alert for a specified duration
   */
  static async snoozeAlert(
    alertId: string, 
    userId: string, 
    snoozeMinutes: number
  ): Promise<Alert | null> {
    const now = new Date();
    const snoozeUntil = new Date(now.getTime() + snoozeMinutes * 60 * 1000);
    
    const updatedAlert = await db
      .update(alerts)
      .set({
        status: 'snoozed',
        snoozeUntil,
        updatedAt: now,
      })
      .where(
        and(
          eq(alerts.id, alertId),
          eq(alerts.userId, userId)
        )
      )
      .returning();

    return updatedAlert.length > 0 ? updatedAlert[0] : null;
  }

  /**
   * Dismiss an alert
   */
  static async dismissAlert(alertId: string, userId: string): Promise<Alert | null> {
    const now = new Date();
    
    const updatedAlert = await db
      .update(alerts)
      .set({
        status: 'dismissed',
        updatedAt: now,
      })
      .where(
        and(
          eq(alerts.id, alertId),
          eq(alerts.userId, userId)
        )
      )
      .returning();

    return updatedAlert.length > 0 ? updatedAlert[0] : null;
  }

  /**
   * Create or update alert settings for an account
   */
  static async upsertAlertSettings(
    userId: string,
    accountId: string,
    alertType: 'credit_utilization' | 'low_balance' | 'spending_limit' | 'unusual_activity',
    settings: {
      thresholdPercentage?: number;
      thresholdAmount?: number;
      isEnabled?: boolean;
    }
  ): Promise<AlertSettings> {
    // Validate input
    const validatedData = alertSettingsCreateSchema.parse({
      userId,
      accountId,
      alertType,
      thresholdPercentage: settings.thresholdPercentage?.toString(),
      thresholdAmount: settings.thresholdAmount?.toString(),
      isEnabled: settings.isEnabled ?? true,
    });

    // Check if settings already exist
    const existingSettings = await db
      .select()
      .from(alertSettings)
      .where(
        and(
          eq(alertSettings.userId, userId),
          eq(alertSettings.accountId, accountId),
          eq(alertSettings.alertType, alertType)
        )
      )
      .limit(1);

    const now = new Date();

    if (existingSettings.length > 0) {
      // Update existing settings
      const updated = await db
        .update(alertSettings)
        .set({
          thresholdPercentage: validatedData.thresholdPercentage,
          thresholdAmount: validatedData.thresholdAmount,
          isEnabled: validatedData.isEnabled,
          updatedAt: now,
        })
        .where(eq(alertSettings.id, existingSettings[0].id))
        .returning();

      return updated[0];
    } else {
      // Create new settings
      const created = await db
        .insert(alertSettings)
        .values({
          userId: validatedData.userId,
          accountId: validatedData.accountId,
          alertType: validatedData.alertType,
          thresholdPercentage: validatedData.thresholdPercentage,
          thresholdAmount: validatedData.thresholdAmount,
          isEnabled: validatedData.isEnabled,
        })
        .returning();

      return created[0];
    }
  }

  /**
   * Get alert settings for an account
   */
  static async getAlertSettings(
    userId: string,
    accountId?: string
  ): Promise<AlertSettings[]> {
    const query = db
      .select()
      .from(alertSettings)
      .where(
        accountId
          ? and(
              eq(alertSettings.userId, userId),
              eq(alertSettings.accountId, accountId)
            )
          : eq(alertSettings.userId, userId)
      );

    return await query;
  }
}
