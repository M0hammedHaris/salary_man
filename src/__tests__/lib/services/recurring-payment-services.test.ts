import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RecurringPaymentService } from '@/lib/services/recurring-payment-service';
import { RecurringPaymentNotificationService } from '@/lib/services/recurring-payment-notification-service';
import { RecurringPaymentBudgetService } from '@/lib/services/recurring-payment-budget-service';

// Mock the database
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock fetch
global.fetch = vi.fn();

const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
};

const mockRecurringPayment = {
  id: 'payment-1',
  name: 'Netflix Subscription',
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  userId: 'test-user-id',
  isActive: true,
  accountId: 'account-1',
  amount: '799.00',
  frequency: 'monthly' as const,
  nextDueDate: new Date('2025-02-01'),
  categoryId: 'category-1',
  status: 'pending' as const,
  reminderDays: '1,3,7',
  lastProcessed: null,
  paymentDate: null,
  account: {
    id: 'account-1',
    name: 'Test Account',
    type: 'checking' as const,
    balance: '5000.00',
    currency: 'INR',
    isActive: true,
  },
  category: {
    id: 'category-1',
    name: 'Entertainment',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    userId: 'test-user-id',
    type: 'expense' as const,
    color: '#FF0000',
    isDefault: false,
    parentId: null,
  },
};

describe('Recurring Payment Services Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('RecurringPaymentService', () => {
    it('should extract merchant pattern correctly', () => {
      const tests = [
        { input: 'NETFLIX.COM PAYMENT', expected: 'netflix.com' },
        { input: 'SPOTIFY PREMIUM 123', expected: 'spotify premium' },
        { input: 'AMAZON PRIME AUTO PAY', expected: 'amazon prime' },
        { input: 'RECURRING BILL PAYMENT', expected: 'bill' },
      ];

      tests.forEach(({ input, expected }) => {
        const result = RecurringPaymentService.extractMerchantPattern(input);
        expect(result).toBe(expected);
      });
    });

    it('should predict next payment date correctly', () => {
      const baseDate = new Date('2025-01-15');
      
      const weeklyNext = RecurringPaymentService.predictNextPaymentDate(baseDate, 'weekly');
      expect(weeklyNext).toEqual(new Date('2025-01-22'));

      const monthlyNext = RecurringPaymentService.predictNextPaymentDate(baseDate, 'monthly');
      expect(monthlyNext).toEqual(new Date('2025-02-15'));

      const quarterlyNext = RecurringPaymentService.predictNextPaymentDate(baseDate, 'quarterly');
      expect(quarterlyNext).toEqual(new Date('2025-04-15'));

      const yearlyNext = RecurringPaymentService.predictNextPaymentDate(baseDate, 'yearly');
      expect(yearlyNext).toEqual(new Date('2026-01-15'));
    });

    it('should calculate pattern confidence correctly', () => {
      const params = {
        amountConsistency: 0.9,
        dateRegularity: 0.8,
        occurrences: 6,
        timeSpan: 180, // 6 months
        minOccurrences: 3,
      };

      const confidence = RecurringPaymentService.calculatePatternConfidence(params);
      
      expect(confidence).toBeGreaterThan(0.5);
      expect(confidence).toBeLessThanOrEqual(1.0);
    });

    it('should generate payment name from pattern', () => {
      const pattern = {
        merchantPattern: 'netflix subscription',
        frequency: 'monthly' as const,
      } as any;

      const name = RecurringPaymentService.generatePaymentName(pattern);
      expect(name).toBe('Netflix Subscription (Monthly)');
    });

    it('should calculate risk score appropriately', () => {
      const lowRiskPattern = {
        confidence: 0.9,
        averageAmount: { gte: () => false },
        amounts: [1, 2, 3, 4, 5, 6],
        dates: [
          new Date('2024-01-01'),
          new Date('2024-02-01'),
          new Date('2024-03-01'),
          new Date('2024-04-01'),
          new Date('2024-05-01'),
          new Date('2024-06-01'),
        ],
      } as any;

      const riskScore = RecurringPaymentService.calculateRiskScore(lowRiskPattern);
      expect(riskScore).toBeGreaterThanOrEqual(0);
      expect(riskScore).toBeLessThanOrEqual(1);
    });
  });

  describe('RecurringPaymentNotificationService', () => {
    it('should create pending alerts correctly', async () => {
      // Mock getRecurringPayments to return test data
      vi.spyOn(RecurringPaymentService, 'getRecurringPayments').mockResolvedValue([
        {
          ...mockRecurringPayment,
          nextDueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        },
      ]);

      const alerts = await RecurringPaymentNotificationService.getPendingAlerts('test-user-id');

      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe('due_soon');
      expect(alerts[0].paymentName).toBe('Netflix Subscription');
      expect(alerts[0].daysUntilDue).toBe(2);
      expect(alerts[0].priority).toBe('medium');
    });

    it('should send pattern detection notification', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      await RecurringPaymentNotificationService.sendPatternDetectedNotification(
        'test-user-id',
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

    it('should send payment confirmation', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      await RecurringPaymentNotificationService.sendPaymentConfirmation(
        'test-user-id',
        {
          paymentId: 'payment-1',
          paymentName: 'Netflix',
          amount: 799,
          processedDate: new Date(),
          transactionId: 'txn-123',
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

    it('should process user notifications correctly', async () => {
      // Mock getPendingAlerts to return test alerts
      vi.spyOn(RecurringPaymentNotificationService, 'getPendingAlerts').mockResolvedValue([
        {
          id: 'alert-1',
          type: 'due_soon',
          paymentId: 'payment-1',
          paymentName: 'Netflix',
          amount: 799,
          dueDate: new Date(),
          daysUntilDue: 1,
          priority: 'high',
          message: 'Netflix is due in 1 day',
        },
      ]);

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const result = await RecurringPaymentNotificationService.processUserNotifications('test-user-id');

      expect(result.totalAlerts).toBe(1);
      expect(result.upcomingReminders).toBe(1);
      expect(result.overdueAlerts).toBe(0);
    });
  });

  describe('RecurringPaymentBudgetService', () => {
    it('should calculate budget impact analysis correctly', async () => {
      // Mock getRecurringPayments to return test data
      vi.spyOn(RecurringPaymentService, 'getRecurringPayments').mockResolvedValue([
        mockRecurringPayment,
        {
          ...mockRecurringPayment,
          id: 'payment-2',
          name: 'Spotify Premium',
          amount: '149.00',
          frequency: 'monthly',
        },
      ]);

      const analysis = await RecurringPaymentBudgetService.getBudgetImpactAnalysis('test-user-id');

      expect(analysis.totalMonthlyRecurring).toBe(948); // 799 + 149
      expect(analysis.categoryBreakdown).toHaveLength(1);
      expect(analysis.categoryBreakdown[0].categoryName).toBe('Entertainment');
      expect(analysis.categoryBreakdown[0].monthlyAmount).toBe(948);
      expect(analysis.categoryBreakdown[0].percentage).toBe(100);
    });

    it('should generate optimization suggestions', async () => {
      // Mock with duplicate payments
      vi.spyOn(RecurringPaymentService, 'getRecurringPayments').mockResolvedValue([
        mockRecurringPayment,
        {
          ...mockRecurringPayment,
          id: 'payment-2',
          name: 'NetFlix Premium', // Similar name
          amount: '899.00', // Higher amount
        },
      ]);

      const analysis = await RecurringPaymentBudgetService.getBudgetImpactAnalysis('test-user-id');

      expect(analysis.optimizationSuggestions.length).toBeGreaterThan(0);
      const duplicateSuggestion = analysis.optimizationSuggestions.find(s => s.type === 'duplicate');
      expect(duplicateSuggestion).toBeTruthy();
      expect(duplicateSuggestion?.paymentIds).toContain('payment-1');
      expect(duplicateSuggestion?.paymentIds).toContain('payment-2');
    });

    it('should calculate spending projections', async () => {
      vi.spyOn(RecurringPaymentService, 'getRecurringPayments').mockResolvedValue([mockRecurringPayment]);

      const projections = await RecurringPaymentBudgetService.getDetailedSpendingProjections(
        'test-user-id',
        6
      );

      expect(projections).toHaveLength(6);
      expect(projections[0].recurringAmount).toBe(799);
      expect(projections[0].month).toMatch(/\w{3} \d{4}/); // Format: "Jan 2025"
    });

    it('should handle budget allocation calculation', async () => {
      vi.spyOn(RecurringPaymentService, 'getRecurringPayments').mockResolvedValue([mockRecurringPayment]);

      const analysis = await RecurringPaymentBudgetService.getBudgetImpactAnalysis('test-user-id');

      expect(analysis.budgetAllocation.totalBudget).toBeGreaterThanOrEqual(0);
      expect(analysis.budgetAllocation.recurringAllocation).toBe(799);
      expect(analysis.budgetAllocation.utilizationPercentage).toBeGreaterThanOrEqual(0);
    });

    it('should calculate trends correctly', async () => {
      vi.spyOn(RecurringPaymentService, 'getRecurringPayments').mockResolvedValue([
        mockRecurringPayment,
        {
          ...mockRecurringPayment,
          id: 'payment-2',
          amount: '500.00',
          frequency: 'weekly',
        },
      ]);

      const analysis = await RecurringPaymentBudgetService.getBudgetImpactAnalysis('test-user-id');

      expect(analysis.trends.monthlyGrowth).toBeGreaterThanOrEqual(0);
      expect(analysis.trends.averagePaymentAmount).toBeGreaterThan(0);
      expect(analysis.trends.mostExpensiveCategory).toBe('Entertainment');
    });

    it('should handle category budget analysis', async () => {
      vi.spyOn(RecurringPaymentService, 'getRecurringPayments').mockResolvedValue([
        mockRecurringPayment,
        {
          ...mockRecurringPayment,
          id: 'payment-2',
          name: 'Electric Bill',
          amount: '2000.00',
          category: {
            id: 'category-2',
            name: 'Utilities',
            type: 'expense' as const,
            color: '#0000FF',
            isActive: true,
          },
        },
      ]);

      const analysis = await RecurringPaymentBudgetService.getBudgetImpactAnalysis('test-user-id');

      expect(analysis.categoryBreakdown).toHaveLength(2);
      
      const entertainmentCategory = analysis.categoryBreakdown.find(c => c.categoryName === 'Entertainment');
      const utilitiesCategory = analysis.categoryBreakdown.find(c => c.categoryName === 'Utilities');
      
      expect(entertainmentCategory).toBeTruthy();
      expect(utilitiesCategory).toBeTruthy();
      expect(utilitiesCategory?.monthlyAmount).toBe(2000);
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete workflow: detection → notification → budget impact', async () => {
      // Step 1: Pattern Detection
      const mockPattern = {
        id: 'pattern-1',
        accountId: 'account-1',
        merchantPattern: 'spotify premium',
        amounts: [149, 149, 149],
        confidence: 0.85,
        frequency: 'monthly' as const,
        averageAmount: { toString: () => '149.00' },
      } as any;

      // Step 2: Send Pattern Detection Notification
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      await RecurringPaymentNotificationService.sendPatternDetectedNotification(
        'test-user-id',
        {
          merchantName: 'Spotify Premium',
          amount: 149,
          frequency: 'monthly',
          confidence: 0.85,
          occurrences: 3,
        }
      );

      // Step 3: Simulate user creation of payment from pattern
      const paymentName = RecurringPaymentService.generatePaymentName(mockPattern);
      expect(paymentName).toBe('Spotify Premium (Monthly)');

      // Step 4: Check budget impact
      vi.spyOn(RecurringPaymentService, 'getRecurringPayments').mockResolvedValue([
        {
          ...mockRecurringPayment,
          name: 'Spotify Premium',
          amount: '149.00',
        },
      ]);

      const analysis = await RecurringPaymentBudgetService.getBudgetImpactAnalysis('test-user-id');
      expect(analysis.totalMonthlyRecurring).toBe(149);

      // Verify notification was sent
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/notifications/send',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should handle error scenarios gracefully', async () => {
      // Test API error handling
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      await expect(
        RecurringPaymentNotificationService.sendPatternDetectedNotification(
          'test-user-id',
          {
            merchantName: 'Test',
            amount: 100,
            frequency: 'monthly',
            confidence: 0.8,
            occurrences: 3,
          }
        )
      ).rejects.toThrow('Network error');

      // Test service error handling
      vi.spyOn(RecurringPaymentService, 'getRecurringPayments').mockRejectedValue(
        new Error('Database error')
      );

      await expect(
        RecurringPaymentBudgetService.getBudgetImpactAnalysis('test-user-id')
      ).rejects.toThrow('Database error');
    });

    it('should handle edge cases correctly', async () => {
      // Empty payments list
      vi.spyOn(RecurringPaymentService, 'getRecurringPayments').mockResolvedValue([]);

      const analysis = await RecurringPaymentBudgetService.getBudgetImpactAnalysis('test-user-id');
      expect(analysis.totalMonthlyRecurring).toBe(0);
      expect(analysis.categoryBreakdown).toHaveLength(0);
      expect(analysis.optimizationSuggestions).toHaveLength(0);

      // No pending alerts
      vi.spyOn(RecurringPaymentNotificationService, 'getPendingAlerts').mockResolvedValue([]);

      const notificationResult = await RecurringPaymentNotificationService.processUserNotifications('test-user-id');
      expect(notificationResult.totalAlerts).toBe(0);
      expect(notificationResult.upcomingReminders).toBe(0);
      expect(notificationResult.overdueAlerts).toBe(0);
    });
  });
});
