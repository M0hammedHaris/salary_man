import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RecurringPaymentService, type TransactionPattern } from '@/lib/services/recurring-payment-service';
import { RecurringPaymentNotificationService } from '@/lib/services/recurring-payment-notification-service';
import { RecurringPaymentBudgetService } from '@/lib/services/recurring-payment-budget-service';
import { db } from '@/lib/db';
import { users, accounts, categories, recurringPayments } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import Decimal from 'decimal.js';

// Test data
const testUser = {
  id: 'recurring-test-user',
  email: 'recurring@test.com',
  firstName: 'Recurring',
  lastName: 'Test',
  preferences: {
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
  }
};

const testAccount = {
  id: 'recurring-test-account',
  userId: 'recurring-test-user',
  name: 'Test Checking',
  type: 'checking' as const,
  balance: '5000.00',
  currency: 'INR',
  isActive: true,
};

const testCategory = {
  id: 'recurring-test-category',
  userId: 'recurring-test-user',
  name: 'Subscriptions',
  type: 'expense' as const,
  color: '#FF0000',
  isActive: true,
};

const testRecurringPayment = {
  id: 'recurring-test-payment',
  userId: 'recurring-test-user',
  accountId: 'recurring-test-account',
  name: 'Netflix Subscription',
  amount: '799.00',
  frequency: 'monthly' as const,
  nextDueDate: new Date('2025-02-01'),
  categoryId: 'recurring-test-category',
  isActive: true,
  status: 'pending' as const,
  reminderDays: '1,3,7',
};

describe('Recurring Payment Services Integration', () => {
  beforeEach(async () => {
    // Clean up any existing test data
    await cleanup();
    
    // Create test user
    await db.insert(users).values(testUser);
    
    // Create test account
    await db.insert(accounts).values(testAccount);
    
    // Create test category
    await db.insert(categories).values(testCategory);
    
    // Create test recurring payment
    await db.insert(recurringPayments).values(testRecurringPayment);
  }, 15000);

  afterEach(async () => {
    await cleanup();
  }, 15000);

  async function cleanup() {
    try {
      await db.delete(recurringPayments).where(eq(recurringPayments.userId, testUser.id));
      await db.delete(categories).where(eq(categories.userId, testUser.id));
      await db.delete(accounts).where(eq(accounts.userId, testUser.id));
      await db.delete(users).where(eq(users.id, testUser.id));
    } catch (error) {
      // Ignore cleanup errors in tests
      console.warn('Test cleanup error:', error);
    }
  }

  describe('RecurringPaymentService', () => {
    it('should retrieve recurring payments', async () => {
      const payments = await RecurringPaymentService.getRecurringPayments(testUser.id);
      
      expect(payments).toHaveLength(1);
      expect(payments[0].name).toBe('Netflix Subscription');
      expect(payments[0].amount).toBe('799.00');
      expect(payments[0].frequency).toBe('monthly');
    });

    it('should update recurring payment', async () => {
      const updatedPayment = await RecurringPaymentService.updateRecurringPayment(
        testRecurringPayment.id,
        testUser.id,
        {
          name: 'Updated Netflix',
          amount: '899.00',
        }
      );

      expect(updatedPayment).toBeTruthy();
      expect(updatedPayment?.name).toBe('Updated Netflix');
      expect(updatedPayment?.amount).toBe('899.00');
    });

    it('should cancel recurring payment', async () => {
      const cancelledPayment = await RecurringPaymentService.cancelRecurringPayment(
        testRecurringPayment.id,
        testUser.id
      );

      expect(cancelledPayment).toBeTruthy();
      expect(cancelledPayment?.isActive).toBe(false);
    });

    it('should get missed payments', async () => {
      // Set payment as overdue
      await db
        .update(recurringPayments)
        .set({
          nextDueDate: new Date('2025-01-01'), // Past date
          status: 'pending',
        })
        .where(eq(recurringPayments.id, testRecurringPayment.id));

      const missedPayments = await RecurringPaymentService.getMissedPayments(testUser.id);
      
      expect(missedPayments.length).toBeGreaterThan(0);
      expect(missedPayments[0].name).toBe('Netflix Subscription');
    });

    it('should create new recurring payment from pattern', async () => {
      const mockPattern: TransactionPattern = {
        id: 'test-pattern',
        accountId: testAccount.id,
        merchantPattern: 'spotify premium',
        amounts: [new Decimal('149.00')],
        dates: [new Date()],
        frequency: 'monthly' as const,
        confidence: 0.9,
        averageAmount: new Decimal('149.00'),
        lastOccurrence: new Date(),
        nextExpectedDate: new Date('2025-03-01'),
        categoryId: testCategory.id,
      };

      const newPayment = await RecurringPaymentService.createRecurringPaymentFromPattern(
        testUser.id,
        mockPattern,
        { name: 'Spotify Premium' }
      );
      
      expect(newPayment).toBeTruthy();
      expect(newPayment.name).toBe('Spotify Premium');
      expect(newPayment.amount).toBe('149.00');
    });
  });

  describe('RecurringPaymentNotificationService', () => {
    it('should get pending alerts', async () => {
      // Set payment as due soon
      await db
        .update(recurringPayments)
        .set({
          nextDueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        })
        .where(eq(recurringPayments.id, testRecurringPayment.id));

      const alerts = await RecurringPaymentNotificationService.getPendingAlerts(testUser.id);
      
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].type).toBe('due_soon');
      expect(alerts[0].paymentName).toBe('Netflix Subscription');
    });

    it('should detect overdue payments', async () => {
      // Set payment as overdue
      await db
        .update(recurringPayments)
        .set({
          nextDueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        })
        .where(eq(recurringPayments.id, testRecurringPayment.id));

      const alerts = await RecurringPaymentNotificationService.getPendingAlerts(testUser.id);
      
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].type).toBe('overdue');
      expect(alerts[0].daysOverdue).toBe(5);
    });

    it('should send pattern detection notification', async () => {
      // Mock fetch for notifications
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      } as Response);

      await RecurringPaymentNotificationService.sendPatternDetectedNotification(
        testUser.id,
        {
          merchantName: 'Amazon Prime',
          amount: 1499,
          frequency: 'yearly',
          confidence: 0.85,
          occurrences: 3,
        }
      );

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/notifications/send',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('should process user notifications', async () => {
      // Set one payment due soon and one overdue
      await db
        .update(recurringPayments)
        .set({
          nextDueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day from now
        })
        .where(eq(recurringPayments.id, testRecurringPayment.id));

      // Mock fetch for notifications
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      } as Response);

      const result = await RecurringPaymentNotificationService.processUserNotifications(testUser.id);
      
      expect(result.totalAlerts).toBeGreaterThan(0);
      expect(result.upcomingReminders + result.overdueAlerts).toBe(result.totalAlerts);
    });
  });

  describe('RecurringPaymentBudgetService', () => {
    it('should get budget impact analysis', async () => {
      const analysis = await RecurringPaymentBudgetService.getBudgetImpactAnalysis(testUser.id);
      
      expect(analysis).toBeTruthy();
      expect(analysis.totalMonthlyRecurring).toBeGreaterThan(0);
      expect(analysis.categoryBreakdown).toHaveLength(1);
      expect(analysis.categoryBreakdown[0].categoryName).toBe('Subscriptions');
      expect(analysis.budgetAllocation).toBeTruthy();
      expect(analysis.trends).toBeTruthy();
      expect(analysis.projections).toBeTruthy();
    });

    it('should calculate spending projections', async () => {
      const projections = await RecurringPaymentBudgetService.getDetailedSpendingProjections(
        testUser.id,
        6
      );
      
      expect(projections).toHaveLength(6);
      expect(projections[0].recurringAmount).toBeGreaterThan(0);
      expect(projections[0].month).toMatch(/\w{3} \d{4}/); // Format: "Jan 2025"
    });

    it('should generate optimization suggestions', async () => {
      // Add a second similar payment to trigger duplicate detection
      const duplicatePayment = {
        ...testRecurringPayment,
        id: 'duplicate-payment',
        name: 'NetFlix Premium', // Similar name
      };
      
      await db.insert(recurringPayments).values(duplicatePayment);

      const analysis = await RecurringPaymentBudgetService.getBudgetImpactAnalysis(testUser.id);
      
      expect(analysis.optimizationSuggestions.length).toBeGreaterThan(0);
      
      const duplicateSuggestion = analysis.optimizationSuggestions.find(s => s.type === 'duplicate');
      expect(duplicateSuggestion).toBeTruthy();
    });

    it('should handle budget allocation calculation', async () => {
      const analysis = await RecurringPaymentBudgetService.getBudgetImpactAnalysis(testUser.id);
      
      expect(analysis.budgetAllocation.totalBudget).toBeGreaterThanOrEqual(0);
      expect(analysis.budgetAllocation.recurringAllocation).toBeGreaterThan(0);
      expect(analysis.budgetAllocation.utilizationPercentage).toBeGreaterThanOrEqual(0);
    });

    it('should calculate category breakdown correctly', async () => {
      const analysis = await RecurringPaymentBudgetService.getBudgetImpactAnalysis(testUser.id);
      
      expect(analysis.categoryBreakdown).toHaveLength(1);
      const category = analysis.categoryBreakdown[0];
      expect(category.monthlyAmount).toBe(799); // From test payment
      expect(category.quarterlyAmount).toBe(799 * 3);
      expect(category.yearlyAmount).toBe(799 * 12);
      expect(category.percentage).toBe(100); // Only one category
      expect(category.paymentCount).toBeGreaterThan(0);
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete recurring payment lifecycle', async () => {
      // 1. Create a new payment from pattern
      const mockPattern: TransactionPattern = {
        id: 'new-pattern',
        accountId: testAccount.id,
        merchantPattern: 'disney plus',
        amounts: [new Decimal('299.00')],
        dates: [new Date()],
        frequency: 'monthly' as const,
        confidence: 0.9,
        averageAmount: new Decimal('299.00'),
        lastOccurrence: new Date(),
        nextExpectedDate: new Date('2025-02-15'),
        categoryId: testCategory.id,
      };

      const newPayment = await RecurringPaymentService.createRecurringPaymentFromPattern(
        testUser.id,
        mockPattern,
        { name: 'Disney+ Subscription' }
      );
      expect(newPayment).toBeTruthy();

      // 2. Get all payments
      const allPayments = await RecurringPaymentService.getRecurringPayments(testUser.id);
      expect(allPayments).toHaveLength(2); // Original + new payment

      // 3. Check budget impact
      const budgetAnalysis = await RecurringPaymentBudgetService.getBudgetImpactAnalysis(testUser.id);
      expect(budgetAnalysis.totalMonthlyRecurring).toBe(799 + 299); // Both payments

      // 4. Check notifications
      const alerts = await RecurringPaymentNotificationService.getPendingAlerts(testUser.id);
      expect(alerts.length).toBeGreaterThanOrEqual(0);

      // 5. Update payment
      const updatedPayment = await RecurringPaymentService.updateRecurringPayment(
        newPayment.id,
        testUser.id,
        { amount: '199.00' }
      );
      expect(updatedPayment?.amount).toBe('199.00');

      // 6. Cancel payment
      const cancelledPayment = await RecurringPaymentService.cancelRecurringPayment(
        newPayment.id,
        testUser.id
      );
      expect(cancelledPayment?.isActive).toBe(false);

      // 7. Verify only active payments in budget
      const finalAnalysis = await RecurringPaymentBudgetService.getBudgetImpactAnalysis(testUser.id);
      expect(finalAnalysis.totalMonthlyRecurring).toBe(799); // Only original payment
    });

    it('should handle pattern detection workflow', async () => {
      // Mock the pattern detection
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      } as Response);

      // Simulate pattern detection notification
      await RecurringPaymentNotificationService.sendPatternDetectedNotification(
        testUser.id,
        {
          merchantName: 'YouTube Premium',
          amount: 129,
          frequency: 'monthly',
          confidence: 0.9,
          occurrences: 4,
        }
      );

      // Simulate user confirmation by creating the payment from pattern
      const confirmationPattern: TransactionPattern = {
        id: 'youtube-pattern',
        accountId: testAccount.id,
        merchantPattern: 'youtube premium',
        amounts: [new Decimal('129.00')],
        dates: [new Date()],
        frequency: 'monthly' as const,
        confidence: 0.9,
        averageAmount: new Decimal('129.00'),
        lastOccurrence: new Date(),
        nextExpectedDate: new Date('2025-02-10'),
        categoryId: testCategory.id,
      };

      const confirmedPayment = await RecurringPaymentService.createRecurringPaymentFromPattern(
        testUser.id,
        confirmationPattern,
        { name: 'YouTube Premium' }
      );
      expect(confirmedPayment).toBeTruthy();

      // Send confirmation notification
      await RecurringPaymentNotificationService.sendPaymentConfirmation(
        testUser.id,
        {
          paymentId: confirmedPayment.id,
          paymentName: confirmedPayment.name,
          amount: parseFloat(confirmedPayment.amount),
          processedDate: new Date(),
          transactionId: 'txn-123',
        }
      );

      expect(global.fetch).toHaveBeenCalledTimes(2); // Pattern detection + confirmation
    });
  });
});
