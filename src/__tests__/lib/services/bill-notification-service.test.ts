import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BillNotificationService } from '../../../lib/services/bill-notification-service';
import { type RecurringPayment, type Account } from '../../../lib/db/schema';
import { type BillReminder } from '../../../lib/services/bill-service';

// Mock fetch globally
global.fetch = vi.fn();

describe('BillNotificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);
  });

  const mockBill: RecurringPayment = {
    id: 'bill-1',
    userId: 'user-1',
    accountId: 'account-1',
    name: 'Credit Card Payment',
    amount: '1500.00',
    frequency: 'monthly',
    nextDueDate: new Date('2025-08-30T00:00:00Z'),
    categoryId: 'category-1',
    isActive: true,
    status: 'pending',
    reminderDays: '1,3,7',
    lastProcessed: null,
    paymentDate: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAccount: Account = {
    id: 'account-1',
    userId: 'user-1',
    name: 'Chase Credit Card',
    type: 'credit_card',
    balance: '-800.00',
    creditLimit: '5000.00',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockBillReminder: BillReminder = {
    bill: mockBill,
    account: mockAccount,
    daysUntilDue: 1,
    reminderType: 'bill_reminder_1_day',
    message: 'Credit Card Payment is due tomorrow',
    isOverdue: false,
  };

  describe('sendBillReminderNotification', () => {
    it('should send notification across all channels when enabled', async () => {
      const channels = { email: true, push: true, inApp: true };

      await BillNotificationService.sendBillReminderNotification(mockBillReminder, channels);

      // Should call all three notification endpoints
      expect(fetch).toHaveBeenCalledTimes(3);
      
      // Check in-app notification call
      expect(fetch).toHaveBeenCalledWith('/api/notifications/in-app', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('Credit Card Payment is due tomorrow'),
      }));

      // Check email notification call
      expect(fetch).toHaveBeenCalledWith('/api/notifications/bill-reminder-email', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('Credit Card Payment'),
      }));

      // Check push notification call
      expect(fetch).toHaveBeenCalledWith('/api/notifications/bill-reminder-push', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('bill-reminder-bill-1'),
      }));
    });

    it('should only send notifications for enabled channels', async () => {
      const channels = { email: true, push: false, inApp: false };

      await BillNotificationService.sendBillReminderNotification(mockBillReminder, channels);

      // Should only call email endpoint
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith('/api/notifications/bill-reminder-email', expect.any(Object));
    });

    it('should determine correct urgency based on days until due', async () => {
      const urgentReminder: BillReminder = {
        ...mockBillReminder,
        daysUntilDue: 0,
        reminderType: 'bill_reminder_due_today',
      };

      await BillNotificationService.sendBillReminderNotification(urgentReminder, { inApp: true, email: false, push: false });

      expect(fetch).toHaveBeenCalledWith('/api/notifications/in-app', expect.objectContaining({
        body: expect.stringContaining('"type":"error"'), // Urgent = error type
      }));
    });

    it('should handle overdue bills with urgent priority', async () => {
      const overdueReminder: BillReminder = {
        ...mockBillReminder,
        daysUntilDue: -1,
        isOverdue: true,
        message: 'Credit Card Payment is overdue',
      };

      await BillNotificationService.sendBillReminderNotification(overdueReminder, { inApp: true, email: false, push: false });

      expect(fetch).toHaveBeenCalledWith('/api/notifications/in-app', expect.objectContaining({
        body: expect.stringContaining('"type":"error"'), // Overdue = urgent = error type
      }));
    });

    it('should handle notification failures gracefully', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

      await expect(
        BillNotificationService.sendBillReminderNotification(mockBillReminder, { email: true, push: false, inApp: false })
      ).rejects.toThrow('Network error');
    });
  });

  describe('sendInsufficientFundsNotification', () => {
    it('should send insufficient funds warning notification', async () => {
      await BillNotificationService.sendInsufficientFundsNotification(
        'user-1',
        mockBill,
        mockAccount,
        '200.00',
        { email: true, push: true, inApp: true }
      );

      expect(fetch).toHaveBeenCalledTimes(3);
      
      // Check that the message contains insufficient funds information
      expect(fetch).toHaveBeenCalledWith('/api/notifications/in-app', expect.objectContaining({
        body: expect.stringContaining('Insufficient funds'),
      }));
    });

    it('should include shortfall amount in notification', async () => {
      await BillNotificationService.sendInsufficientFundsNotification(
        'user-1',
        mockBill,
        mockAccount,
        '750.50',
        { inApp: true, email: false, push: false }
      );

      expect(fetch).toHaveBeenCalledWith('/api/notifications/in-app', expect.objectContaining({
        body: expect.stringContaining('750.50'),
      }));
    });
  });

  describe('sendPaymentConfirmationNotification', () => {
    it('should send payment confirmation notification', async () => {
      await BillNotificationService.sendPaymentConfirmationNotification(
        'user-1',
        mockBill,
        mockAccount,
        '1500.00',
        { email: true, push: false, inApp: true }
      );

      expect(fetch).toHaveBeenCalledTimes(2);
      
      expect(fetch).toHaveBeenCalledWith('/api/notifications/in-app', expect.objectContaining({
        body: expect.stringContaining('Payment Confirmed'),
      }));

      expect(fetch).toHaveBeenCalledWith('/api/notifications/bill-reminder-email', expect.objectContaining({
        body: expect.stringContaining('1500.00'),
      }));
    });

    it('should use lower urgency for payment confirmations', async () => {
      await BillNotificationService.sendPaymentConfirmationNotification(
        'user-1',
        mockBill,
        mockAccount,
        '1500.00',
        { inApp: true, email: false, push: false }
      );

      expect(fetch).toHaveBeenCalledWith('/api/notifications/in-app', expect.objectContaining({
        body: expect.stringContaining('"type":"info"'), // Low urgency = info type
      }));
    });
  });

  describe('getBillNotificationPreferences', () => {
    it('should return default preferences', async () => {
      const preferences = await BillNotificationService.getBillNotificationPreferences('user-1', 'bill-1');

      expect(preferences).toEqual({
        email: true,
        push: true,
        inApp: true,
        sms: false,
      });
    });
  });

  describe('title generation', () => {
    it('should generate appropriate titles for different reminder types', async () => {
      const testCases = [
        { daysUntilDue: 0, isOverdue: false, expectedTitle: 'Bill Due Today: Credit Card Payment' },
        { daysUntilDue: 1, isOverdue: false, expectedTitle: 'Bill Due Tomorrow: Credit Card Payment' },
        { daysUntilDue: 3, isOverdue: false, expectedTitle: 'Bill Reminder: Credit Card Payment' },
        { daysUntilDue: -1, isOverdue: true, expectedTitle: 'Overdue Bill: Credit Card Payment' },
      ];

      for (const testCase of testCases) {
        const reminder: BillReminder = {
          ...mockBillReminder,
          daysUntilDue: testCase.daysUntilDue,
          isOverdue: testCase.isOverdue,
        };

        await BillNotificationService.sendBillReminderNotification(reminder, { inApp: true, email: false, push: false });

        expect(fetch).toHaveBeenCalledWith('/api/notifications/in-app', expect.objectContaining({
          body: expect.stringContaining(`"title":"${testCase.expectedTitle}"`),
        }));

        vi.clearAllMocks();
        vi.mocked(fetch).mockResolvedValue({
          ok: true,
          json: async () => ({ success: true }),
        } as Response);
      }
    });
  });

  describe('escalating reminder notifications', () => {
    it('should set appropriate urgency levels for different reminder stages', async () => {
      const testCases = [
        { daysUntilDue: 14, expectedType: 'info' }, // Low urgency
        { daysUntilDue: 7, expectedType: 'info' }, // Low urgency
        { daysUntilDue: 3, expectedType: 'warning' }, // Medium urgency
        { daysUntilDue: 1, expectedType: 'warning' }, // High urgency
        { daysUntilDue: 0, expectedType: 'error' }, // Urgent
      ];

      for (const testCase of testCases) {
        const reminder: BillReminder = {
          ...mockBillReminder,
          daysUntilDue: testCase.daysUntilDue,
        };

        await BillNotificationService.sendBillReminderNotification(reminder, { inApp: true, email: false, push: false });

        expect(fetch).toHaveBeenCalledWith('/api/notifications/in-app', expect.objectContaining({
          body: expect.stringContaining(`"type":"${testCase.expectedType}"`),
        }));

        vi.clearAllMocks();
        vi.mocked(fetch).mockResolvedValue({
          ok: true,
          json: async () => ({ success: true }),
        } as Response);
      }
    });
  });
});
