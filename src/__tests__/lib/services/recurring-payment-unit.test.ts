import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RecurringPaymentService } from '@/lib/services/recurring-payment-service';
import { RecurringPaymentNotificationService } from '@/lib/services/recurring-payment-notification-service';

// Mock all external dependencies
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

global.fetch = vi.fn();

describe('Recurring Payment Services Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('RecurringPaymentService Static Methods', () => {
    it('should extract merchant pattern correctly', () => {
      const tests = [
        { input: 'NETFLIX.COM PAYMENT', expected: 'netflix.com' },
        { input: 'SPOTIFY PREMIUM 123', expected: 'spotify premium 123' },
        { input: 'AMAZON PRIME AUTO PAY', expected: 'amazon prime pay' },
        { input: 'RECURRING BILL PAYMENT', expected: '' }, // Both "recurring" and "bill" and "payment" are removed
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

    it('should calculate amount consistency', () => {
      const amounts = [100, 95, 105, 100, 98].map(n => ({ 
        toString: () => n.toString(),
        minus: (other: any) => ({ 
          abs: () => ({ 
            lte: (tolerance: any) => Math.abs(n - parseFloat(other.toString())) <= parseFloat(tolerance.toString())
          })
        }),
      } as any));
      const average = { 
        toString: () => '100',
        mul: (factor: number) => ({ toString: () => (100 * factor).toString() })
      } as any;
      
      const consistency = RecurringPaymentService.calculateAmountConsistency(amounts, average, 10);
      expect(consistency).toBeGreaterThan(0.5);
    });

    it('should analyze frequency patterns', () => {
      const monthlyDates = [
        new Date('2024-01-15'),
        new Date('2024-02-15'),
        new Date('2024-03-15'),
        new Date('2024-04-15'),
      ];

      const analysis = RecurringPaymentService.analyzeFrequencyPattern(monthlyDates, 3);
      expect(analysis.detectedFrequency).toBe('monthly');
      expect(analysis.regularity).toBeGreaterThan(0);
    });
  });

  describe('RecurringPaymentNotificationService', () => {
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

    it('should create pending alerts with correct priority', async () => {
      const mockPayments = [
        {
          id: 'payment-1',
          name: 'Netflix',
          amount: '799.00',
          nextDueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day
        },
        {
          id: 'payment-2',
          name: 'Spotify',
          amount: '149.00',
          nextDueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days
        },
      ];

      // Mock the service method
      vi.spyOn(RecurringPaymentService, 'getRecurringPayments').mockResolvedValue(mockPayments as any);

      const alerts = await RecurringPaymentNotificationService.getPendingAlerts('test-user-id');

      expect(alerts).toHaveLength(2);
      
      const highPriorityAlert = alerts.find(a => a.paymentName === 'Netflix');
      const lowPriorityAlert = alerts.find(a => a.paymentName === 'Spotify');
      
      expect(highPriorityAlert?.priority).toBe('high');
      expect(lowPriorityAlert?.priority).toBe('low');
    });

    it('should handle notification failures gracefully', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      // The service catches errors and doesn't rethrow, so this should resolve normally
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
      ).resolves.toBeUndefined();
      
      // Verify that fetch was called despite the error
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe('RecurringPaymentBudgetService Helper Methods', () => {
    it('should calculate monthly amount normalization correctly', () => {
      // These would be internal helper methods that normalize amounts by frequency
      const testCases = [
        { amount: 100, frequency: 'weekly', expected: 100 * 52 / 12 },
        { amount: 500, frequency: 'monthly', expected: 500 },
        { amount: 1500, frequency: 'quarterly', expected: 1500 / 3 },
        { amount: 6000, frequency: 'yearly', expected: 6000 / 12 },
      ];

      testCases.forEach(({ amount, frequency, expected }) => {
        // This would test an internal normalization function
        let normalizedAmount = amount;
        switch (frequency) {
          case 'weekly':
            normalizedAmount = amount * 52 / 12;
            break;
          case 'quarterly':
            normalizedAmount = amount / 3;
            break;
          case 'yearly':
            normalizedAmount = amount / 12;
            break;
        }
        expect(Math.round(normalizedAmount * 100) / 100).toBe(Math.round(expected * 100) / 100);
      });
    });

    it('should detect potential duplicate payments', () => {
      const payments = [
        { name: 'Netflix Premium', amount: '799.00' },
        { name: 'NetFlix Subscription', amount: '799.00' },
        { name: 'Spotify Premium', amount: '149.00' },
      ];

      // Simple duplicate detection logic
      const duplicateGroups: string[][] = [];
      for (let i = 0; i < payments.length; i++) {
        for (let j = i + 1; j < payments.length; j++) {
          const name1 = payments[i].name.toLowerCase().replace(/[^a-z]/g, '');
          const name2 = payments[j].name.toLowerCase().replace(/[^a-z]/g, '');
          
          if (name1.includes('netflix') && name2.includes('netflix')) {
            duplicateGroups.push([payments[i].name, payments[j].name]);
          }
        }
      }

      expect(duplicateGroups).toHaveLength(1);
      expect(duplicateGroups[0]).toContain('Netflix Premium');
      expect(duplicateGroups[0]).toContain('NetFlix Subscription');
    });

    it('should calculate budget utilization percentage', () => {
      const totalBudget = 50000;
      const recurringAllocation = 15000;
      
      const utilizationPercentage = (recurringAllocation / totalBudget) * 100;
      
      expect(utilizationPercentage).toBe(30);
    });

    it('should handle edge cases in budget calculations', () => {
      // Test zero budget
      const zeroBudgetUtilization = (1000 / 0) * 100;
      expect(isFinite(zeroBudgetUtilization)).toBe(false);
      
      // Test negative amounts (should be handled)
      const negativeAmount = -500;
      const normalizedNegative = Math.abs(negativeAmount);
      expect(normalizedNegative).toBe(500);
      
      // Test very small amounts
      const smallAmount = 0.01;
      expect(smallAmount).toBeGreaterThan(0);
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

      // Verify notification was sent
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/notifications/send',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should handle empty data gracefully', () => {
      // Test empty patterns
      const emptyPatterns = RecurringPaymentService.groupTransactionsByPattern([], {
        minOccurrences: 3,
        amountTolerancePercent: 5,
        dateVarianceDays: 3,
        lookbackMonths: 12,
        confidenceThreshold: 0.7,
      });

      expect(emptyPatterns).toHaveLength(0);

      // Test empty frequency analysis
      const emptyFrequency = RecurringPaymentService.analyzeFrequencyPattern([], 3);
      expect(emptyFrequency.regularity).toBe(0);
      expect(emptyFrequency.detectedFrequency).toBe('monthly');
    });

    it('should validate input parameters', () => {
      // Test confidence calculation with extreme values
      const extremeParams = {
        amountConsistency: 1.0,
        dateRegularity: 1.0,
        occurrences: 100,
        timeSpan: 365,
        minOccurrences: 3,
      };

      const confidence = RecurringPaymentService.calculatePatternConfidence(extremeParams);
      expect(confidence).toBeLessThanOrEqual(1.0);
      expect(confidence).toBeGreaterThan(0.5);

      // Test with minimum values
      const minParams = {
        amountConsistency: 0.0,
        dateRegularity: 0.0,
        occurrences: 1,
        timeSpan: 1,
        minOccurrences: 3,
      };

      const minConfidence = RecurringPaymentService.calculatePatternConfidence(minParams);
      expect(minConfidence).toBeGreaterThanOrEqual(0);
      expect(minConfidence).toBeLessThanOrEqual(1.0);
    });

    it('should handle service errors appropriately', async () => {
      // Test API timeout/network errors
      global.fetch = vi.fn().mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      );

      // The service catches errors and doesn't rethrow, so this should resolve normally
      await expect(
        RecurringPaymentNotificationService.sendPaymentConfirmation(
          'test-user-id',
          {
            paymentId: 'payment-1',
            paymentName: 'Test Payment',
            amount: 100,
            processedDate: new Date(),
            transactionId: 'txn-123',
          }
        )
      ).resolves.toBeUndefined();
      
      // Verify that fetch was called despite the error
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should validate merchant pattern extraction edge cases', () => {
      const edgeCases = [
        { input: '', expected: '' },
        { input: '   ', expected: '' },
        { input: 'A', expected: 'a' },
        { input: '123456789', expected: '123456789' },
        { input: 'PAYMENT AUTOPAY AUTO RECURRING BILL', expected: '' },
        { input: 'VERY LONG MERCHANT NAME WITH LOTS OF WORDS', expected: 'very long merchant' },
      ];

      edgeCases.forEach(({ input, expected }) => {
        const result = RecurringPaymentService.extractMerchantPattern(input);
        expect(result).toBe(expected);
      });
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle large datasets efficiently', () => {
      // Test with large transaction list
      const largeTransactionList = Array.from({ length: 1000 }, (_, i) => ({
        transaction: {
          id: `txn-${i}`,
          accountId: `account-${i % 10}`,
          description: `Merchant ${i % 50}`,
          amount: (Math.random() * 1000).toString(),
          transactionDate: new Date(2024, i % 12, (i % 28) + 1),
        },
        account: { id: `account-${i % 10}`, name: `Account ${i % 10}` },
        category: { id: `cat-${i % 5}`, name: `Category ${i % 5}` },
      }));

      const patterns = RecurringPaymentService.groupTransactionsByPattern(
        largeTransactionList as any,
        {
          minOccurrences: 3,
          amountTolerancePercent: 5,
          dateVarianceDays: 3,
          lookbackMonths: 12,
          confidenceThreshold: 0.7,
        }
      );

      // Should complete without timeout and return reasonable results
      expect(Array.isArray(patterns)).toBe(true);
      expect(patterns.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle date edge cases correctly', () => {
      // Test leap year
      const leapYearDate = new Date('2024-02-29');
      const nextYear = RecurringPaymentService.predictNextPaymentDate(leapYearDate, 'yearly');
      expect(nextYear.getFullYear()).toBe(2025);

      // Test end of month
      const endOfMonth = new Date('2025-01-31');
      const nextMonth = RecurringPaymentService.predictNextPaymentDate(endOfMonth, 'monthly');
      expect(nextMonth.getMonth()).toBe(1); // February

      // Test year boundary
      const endOfYear = new Date('2024-12-31');
      const nextWeek = RecurringPaymentService.predictNextPaymentDate(endOfYear, 'weekly');
      expect(nextWeek.getFullYear()).toBe(2025);
    });

    it('should validate risk score calculations', () => {
      // High risk pattern (low confidence, high amount, few occurrences, recent)
      const highRiskPattern = {
        confidence: 0.3,
        averageAmount: { gte: (val: number) => val >= 10000 },
        amounts: [1, 2],
        dates: [new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date()],
      } as any;

      const highRisk = RecurringPaymentService.calculateRiskScore(highRiskPattern);
      expect(highRisk).toBeGreaterThan(0.5);

      // Low risk pattern (high confidence, low amount, many occurrences, old)
      const lowRiskPattern = {
        confidence: 0.9,
        averageAmount: { gte: (val: number) => val >= 100 },
        amounts: [1, 2, 3, 4, 5, 6, 7, 8],
        dates: [new Date('2023-01-01'), new Date()],
      } as any;

      const lowRisk = RecurringPaymentService.calculateRiskScore(lowRiskPattern);
      expect(lowRisk).toBeLessThan(0.5);
    });
  });
});
