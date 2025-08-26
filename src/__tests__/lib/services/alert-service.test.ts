import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Decimal from 'decimal.js';
import { eq } from 'drizzle-orm';
import { db } from '../../../lib/db';
import { users, accounts, alerts, alertSettings } from '../../../lib/db/schema';
import { AlertService } from '../../../lib/services/alert-service';
import type { NewUser, NewAccount } from '../../../lib/db/schema';

// Test data setup
const testUser: NewUser = {
  id: 'alert-service-test-user',
  email: 'alert-test@example.com',
  firstName: 'Alert',
  lastName: 'Test',
  preferences: {
    currency: 'INR',
    dateFormat: 'MM/dd/yyyy',
    alertThresholds: {
      creditCard: 50, // Set lower threshold so 40% won't trigger
      lowBalance: 100
    },
    notifications: {
      email: true,
      push: true,
      sms: false
    }
  }
};

const testCreditAccount: NewAccount = {
  userId: testUser.id,
  name: 'Test Credit Card',
  type: 'credit_card',
  balance: '-1000.00', // ₹1000 debt (20% utilization - below 30% threshold)
  creditLimit: '5000.00' // ₹5000 limit
};

describe('AlertService', () => {
  let testAccountId: string;

  beforeEach(async () => {
    // Create test user
    await db.insert(users).values(testUser).onConflictDoNothing();
    
    // Create test account
    const accountResult = await db.insert(accounts).values(testCreditAccount).returning({ id: accounts.id });
    testAccountId = accountResult[0].id;
  });

  afterEach(async () => {
    // Clean up test data
    await db.delete(alerts).where(eq(alerts.userId, testUser.id));
    await db.delete(alertSettings).where(eq(alertSettings.userId, testUser.id));
    await db.delete(accounts).where(eq(accounts.userId, testUser.id));
    await db.delete(users).where(eq(users.id, testUser.id));
  });

  describe('calculateCreditUtilization', () => {
    it('should calculate correct utilization for credit card', async () => {
      const account = await db.select().from(accounts).where(eq(accounts.id, testAccountId)).limit(1);
      const utilizationData = AlertService.calculateCreditUtilization(account[0]);

      expect(utilizationData).toBeDefined();
      expect(utilizationData!.utilizationPercentage.toNumber()).toBe(20); // 1000/5000 * 100 = 20%
      expect(utilizationData!.utilizationAmount.toNumber()).toBe(1000);
      expect(utilizationData!.creditLimit.toNumber()).toBe(5000);
    });

    it('should return null for non-credit card accounts', async () => {
      const savingsAccount: NewAccount = {
        userId: testUser.id,
        name: 'Test Savings',
        type: 'savings',
        balance: '1000.00'
      };

      const savingsResult = await db.insert(accounts).values(savingsAccount).returning();
      const utilizationData = AlertService.calculateCreditUtilization(savingsResult[0]);

      expect(utilizationData).toBeNull();
    });
  });

  describe('checkCreditUtilizationAlert', () => {
    it('should trigger alert when utilization exceeds default threshold', async () => {
      // Update account to 85% utilization (4250/5000)
      await db.update(accounts)
        .set({ balance: '-4250.00' })
        .where(eq(accounts.id, testAccountId));

      const account = await db.select().from(accounts).where(eq(accounts.id, testAccountId)).limit(1);
      const utilizationData = AlertService.calculateCreditUtilization(account[0])!;
      
      const alertResults = await AlertService.checkCreditUtilizationAlert(testUser.id, utilizationData);

      expect(alertResults.length).toBeGreaterThan(0);
      expect(alertResults[0].shouldAlert).toBe(true);
      expect(alertResults[0].alertType).toBe('credit_utilization');
      expect(alertResults[0].message).toContain('85.0%');
    });

    it('should not trigger alert when utilization is below thresholds', async () => {
      // Use current 20% utilization - below 30% threshold
      const account = await db.select().from(accounts).where(eq(accounts.id, testAccountId)).limit(1);
      const utilizationData = AlertService.calculateCreditUtilization(account[0])!;
      
      const alertResults = await AlertService.checkCreditUtilizationAlert(testUser.id, utilizationData);

      expect(alertResults).toHaveLength(0);
    });

    it('should use custom alert settings when available', async () => {
      // Create custom setting for 15% threshold
      await AlertService.upsertAlertSettings(
        testUser.id,
        testAccountId,
        'credit_utilization',
        { thresholdPercentage: 15, isEnabled: true }
      );

      // Current utilization is 20%, should trigger custom 15% threshold
      const account = await db.select().from(accounts).where(eq(accounts.id, testAccountId)).limit(1);
      const utilizationData = AlertService.calculateCreditUtilization(account[0])!;
      
      const alertResults = await AlertService.checkCreditUtilizationAlert(testUser.id, utilizationData);

      expect(alertResults.length).toBeGreaterThan(0);
      expect(alertResults[0].thresholdValue.toNumber()).toBe(15);
    });
  });

  describe('checkSpamPrevention', () => {
    it('should prevent alerts within minimum interval', async () => {
      // Create a recent alert
      await AlertService.createAlert(testUser.id, testAccountId, {
        shouldAlert: true,
        alertType: 'credit_utilization',
        message: 'Test alert',
        currentValue: new Decimal(85),
        thresholdValue: new Decimal(80),
        thresholdType: 'percentage'
      });

      const shouldPrevent = await AlertService.checkSpamPrevention(
        testUser.id,
        testAccountId,
        'credit_utilization'
      );

      expect(shouldPrevent).toBe(true);
    });

    it('should allow alerts after minimum interval', async () => {
      const shouldPrevent = await AlertService.checkSpamPrevention(
        testUser.id,
        testAccountId,
        'credit_utilization'
      );

      expect(shouldPrevent).toBe(false);
    });
  });

  describe('processAccountAlerts', () => {
    it('should create alert for high credit utilization', async () => {
      // Set high utilization
      await db.update(accounts)
        .set({ balance: '-4750.00' }) // 95% utilization
        .where(eq(accounts.id, testAccountId));

      const createdAlerts = await AlertService.processAccountAlerts(testUser.id, testAccountId);

      expect(createdAlerts.length).toBeGreaterThan(0);
      expect(createdAlerts[0].alertType).toBe('credit_utilization');
      expect(createdAlerts[0].status).toBe('triggered');
    });

    it('should not create duplicate alerts due to spam prevention', async () => {
      // Set high utilization
      await db.update(accounts)
        .set({ balance: '-4750.00' }) // 95% utilization
        .where(eq(accounts.id, testAccountId));

      // First call should create alerts
      const firstAlerts = await AlertService.processAccountAlerts(testUser.id, testAccountId);
      expect(firstAlerts.length).toBeGreaterThan(0);

      // Second call immediately after should be prevented
      const secondAlerts = await AlertService.processAccountAlerts(testUser.id, testAccountId);
      expect(secondAlerts.length).toBe(0);
    });
  });

  describe('Alert management', () => {
    it('should acknowledge alert', async () => {
      const alert = await AlertService.createAlert(testUser.id, testAccountId, {
        shouldAlert: true,
        alertType: 'credit_utilization',
        message: 'Test alert',
        currentValue: new Decimal(85),
        thresholdValue: new Decimal(80),
        thresholdType: 'percentage'
      });

      const acknowledged = await AlertService.acknowledgeAlert(alert.id, testUser.id);

      expect(acknowledged).toBeDefined();
      expect(acknowledged!.status).toBe('acknowledged');
      expect(acknowledged!.acknowledgedAt).toBeDefined();
    });

    it('should snooze alert', async () => {
      const alert = await AlertService.createAlert(testUser.id, testAccountId, {
        shouldAlert: true,
        alertType: 'credit_utilization',
        message: 'Test alert',
        currentValue: new Decimal(85),
        thresholdValue: new Decimal(80),
        thresholdType: 'percentage'
      });

      const snoozed = await AlertService.snoozeAlert(alert.id, testUser.id, 60);

      expect(snoozed).toBeDefined();
      expect(snoozed!.status).toBe('snoozed');
      expect(snoozed!.snoozeUntil).toBeDefined();
    });

    it('should dismiss alert', async () => {
      const alert = await AlertService.createAlert(testUser.id, testAccountId, {
        shouldAlert: true,
        alertType: 'credit_utilization',
        message: 'Test alert',
        currentValue: new Decimal(85),
        thresholdValue: new Decimal(80),
        thresholdType: 'percentage'
      });

      const dismissed = await AlertService.dismissAlert(alert.id, testUser.id);

      expect(dismissed).toBeDefined();
      expect(dismissed!.status).toBe('dismissed');
    });
  });

  describe('Alert settings management', () => {
    it('should create new alert settings', async () => {
      const settings = await AlertService.upsertAlertSettings(
        testUser.id,
        testAccountId,
        'credit_utilization',
        { thresholdPercentage: 75, isEnabled: true }
      );

      expect(settings.thresholdPercentage).toBe('75.00');
      expect(settings.isEnabled).toBe(true);
    });

    it('should update existing alert settings', async () => {
      // Create initial settings
      await AlertService.upsertAlertSettings(
        testUser.id,
        testAccountId,
        'credit_utilization',
        { thresholdPercentage: 75, isEnabled: true }
      );

      // Update settings
      const updated = await AlertService.upsertAlertSettings(
        testUser.id,
        testAccountId,
        'credit_utilization',
        { thresholdPercentage: 85, isEnabled: false }
      );

      expect(updated.thresholdPercentage).toBe('85.00');
      expect(updated.isEnabled).toBe(false);
    });

    it('should get alert settings for account', async () => {
      await AlertService.upsertAlertSettings(
        testUser.id,
        testAccountId,
        'credit_utilization',
        { thresholdPercentage: 80, isEnabled: true }
      );

      const settings = await AlertService.getAlertSettings(testUser.id, testAccountId);

      expect(settings.length).toBe(1);
      expect(settings[0].alertType).toBe('credit_utilization');
    });
  });

  describe('Alert history', () => {
    it('should retrieve alert history', async () => {
      // Create multiple alerts
      await AlertService.createAlert(testUser.id, testAccountId, {
        shouldAlert: true,
        alertType: 'credit_utilization',
        message: 'Alert 1',
        currentValue: new Decimal(85),
        thresholdValue: new Decimal(80),
        thresholdType: 'percentage'
      });

      await AlertService.createAlert(testUser.id, testAccountId, {
        shouldAlert: true,
        alertType: 'credit_utilization',
        message: 'Alert 2',
        currentValue: new Decimal(90),
        thresholdValue: new Decimal(85),
        thresholdType: 'percentage'
      });

      const history = await AlertService.getAlertHistory(testUser.id, {
        limit: 10,
        offset: 0
      });

      expect(history.length).toBe(2);
      expect(history[0].message).toBe('Alert 2'); // Most recent first
    });
  });
});
