import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { POST, GET } from '@/app/api/recurring-payments/notifications/route';
import { db } from '@/lib/db';
import { users, accounts, categories, recurringPayments } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/services/recurring-payment-notification-service', () => ({
  RecurringPaymentNotificationService: {
    processUserNotifications: vi.fn(),
    getPendingAlerts: vi.fn(),
    sendUpcomingPaymentReminders: vi.fn(),
    sendOverduePaymentAlerts: vi.fn(),
  },
}));

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(() => ({ userId: 'test-user-id' })),
}));

const { RecurringPaymentNotificationService } = await import('@/lib/services/recurring-payment-notification-service');

// Test data setup
const testUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  preferences: {
    currency: 'INR',
    dateFormat: 'MM/dd/yyyy',
    alertThresholds: { creditCard: 80, lowBalance: 100 },
    notifications: { email: true, push: true, sms: false }
  }
};

const testAccount = {
  id: 'test-account-id',
  userId: 'test-user-id',
  name: 'Test Account',
  type: 'checking' as const,
  balance: '5000.00',
  currency: 'INR',
  isActive: true,
};

const testCategory = {
  id: 'test-category-id',
  userId: 'test-user-id',
  name: 'Test Category',
  type: 'expense' as const,
  color: '#FF0000',
  isActive: true,
};

const testRecurringPayment = {
  id: 'test-payment-id',
  userId: 'test-user-id',
  accountId: 'test-account-id',
  name: 'Test Payment',
  amount: '1000.00',
  frequency: 'monthly' as const,
  nextDueDate: new Date('2025-02-01'),
  categoryId: 'test-category-id',
  isActive: true,
  status: 'pending' as const,
  reminderDays: '1,3,7',
};

describe('/api/recurring-payments/notifications', () => {
  beforeEach(async () => {
    // Clean up and create test data
    await cleanup();
    await db.insert(users).values(testUser);
    await db.insert(accounts).values(testAccount);
    await db.insert(categories).values(testCategory);
    await db.insert(recurringPayments).values(testRecurringPayment);
  });

  afterEach(async () => {
    await cleanup();
    vi.clearAllMocks();
  });

  async function cleanup() {
    try {
      await db.delete(recurringPayments).where(eq(recurringPayments.userId, testUser.id));
      await db.delete(categories).where(eq(categories.userId, testUser.id));
      await db.delete(accounts).where(eq(accounts.userId, testUser.id));
      await db.delete(users).where(eq(users.id, testUser.id));
    } catch (error) {
      // Ignore cleanup errors
      console.warn('Test cleanup error:', error);
    }
  }

  describe('POST /api/recurring-payments/notifications', () => {
    it('should send notifications successfully', async () => {
      const mockProcessResult = {
        totalAlerts: 5,
        upcomingReminders: 3,
        overdueAlerts: 2,
        processedUsers: 1,
      };

      (RecurringPaymentNotificationService.processUserNotifications as any)
        .mockResolvedValue(mockProcessResult);

      const request = new NextRequest('http://localhost:3000/api/recurring-payments/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'all',
          userIds: ['test-user-id'],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.result).toEqual(mockProcessResult);
      expect(RecurringPaymentNotificationService.processUserNotifications).toHaveBeenCalledWith('test-user-id');
    });

    it('should handle upcoming reminders notification type', async () => {
      (RecurringPaymentNotificationService.sendUpcomingPaymentReminders as any)
        .mockResolvedValue({ sent: 2, failed: 0 });

      const request = new NextRequest('http://localhost:3000/api/recurring-payments/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'upcoming',
          userIds: ['test-user-id'],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(RecurringPaymentNotificationService.sendUpcomingPaymentReminders).toHaveBeenCalledWith('test-user-id');
    });

    it('should handle overdue alerts notification type', async () => {
      (RecurringPaymentNotificationService.sendOverduePaymentAlerts as any)
        .mockResolvedValue({ sent: 1, failed: 0 });

      const request = new NextRequest('http://localhost:3000/api/recurring-payments/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'overdue',
          userIds: ['test-user-id'],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(RecurringPaymentNotificationService.sendOverduePaymentAlerts).toHaveBeenCalledWith('test-user-id');
    });

    it('should validate request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/recurring-payments/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Missing required fields
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('validation');
    });

    it('should handle service errors gracefully', async () => {
      (RecurringPaymentNotificationService.processUserNotifications as any)
        .mockRejectedValue(new Error('Service error'));

      const request = new NextRequest('http://localhost:3000/api/recurring-payments/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'all',
          userIds: ['test-user-id'],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to send notifications');
    });

    it('should handle invalid notification type', async () => {
      const request = new NextRequest('http://localhost:3000/api/recurring-payments/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'invalid-type',
          userIds: ['test-user-id'],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });

  describe('GET /api/recurring-payments/notifications', () => {
    it('should get pending alerts successfully', async () => {
      const mockPendingAlerts = [
        {
          id: 'alert-1',
          type: 'due_soon',
          paymentId: 'payment-1',
          paymentName: 'Netflix',
          amount: 799,
          dueDate: new Date('2025-02-01'),
          daysUntilDue: 2,
          priority: 'medium',
          message: 'Netflix is due in 2 days',
        },
      ];

      (RecurringPaymentNotificationService.getPendingAlerts as any)
        .mockResolvedValue(mockPendingAlerts);

      const request = new NextRequest('http://localhost:3000/api/recurring-payments/notifications', {
        method: 'GET',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.result.pendingAlerts).toEqual(mockPendingAlerts);
      expect(data.result.processed).toBe(true);
      expect(RecurringPaymentNotificationService.getPendingAlerts).toHaveBeenCalledWith('test-user-id');
    });

    it('should handle no pending alerts', async () => {
      (RecurringPaymentNotificationService.getPendingAlerts as any)
        .mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/recurring-payments/notifications', {
        method: 'GET',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.result.pendingAlerts).toEqual([]);
      expect(data.result.processed).toBe(true);
    });

    it('should handle service errors in GET request', async () => {
      (RecurringPaymentNotificationService.getPendingAlerts as any)
        .mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/recurring-payments/notifications', {
        method: 'GET',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to process missed payments');
    });
  });

  describe('Authentication', () => {
    it('should handle unauthenticated requests', async () => {
      // Mock unauthenticated user
      vi.doMock('@clerk/nextjs/server', () => ({
        auth: vi.fn(() => ({ userId: null })),
      }));

      const { POST: UnauthenticatedPOST } = await import('@/app/api/recurring-payments/notifications/route');

      const request = new NextRequest('http://localhost:3000/api/recurring-payments/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'all',
          userIds: ['test-user-id'],
        }),
      });

      const response = await UnauthenticatedPOST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON in request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/recurring-payments/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid-json{',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should handle missing request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/recurring-payments/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should handle large user lists efficiently', async () => {
      const largeUserList = Array.from({ length: 100 }, (_, i) => `user-${i}`);

      (RecurringPaymentNotificationService.processUserNotifications as any)
        .mockResolvedValue({ totalAlerts: 200, upcomingReminders: 120, overdueAlerts: 80 });

      const request = new NextRequest('http://localhost:3000/api/recurring-payments/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'all',
          userIds: largeUserList,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      // Should process notifications for all users
      expect(RecurringPaymentNotificationService.processUserNotifications).toHaveBeenCalledTimes(largeUserList.length);
    });
  });

  describe('Rate Limiting and Performance', () => {
    it('should handle concurrent requests', async () => {
      (RecurringPaymentNotificationService.processUserNotifications as any)
        .mockResolvedValue({ totalAlerts: 1, upcomingReminders: 1, overdueAlerts: 0 });

      const requests = Array.from({ length: 5 }, () =>
        new NextRequest('http://localhost:3000/api/recurring-payments/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'all',
            userIds: ['test-user-id'],
          }),
        })
      );

      const responses = await Promise.all(requests.map(req => POST(req)));

      // All requests should succeed
      for (const response of responses) {
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
      }
    });

    it('should handle timeout scenarios', async () => {
      // Simulate slow service
      (RecurringPaymentNotificationService.processUserNotifications as any)
        .mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 10000)));

      const request = new NextRequest('http://localhost:3000/api/recurring-payments/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'all',
          userIds: ['test-user-id'],
        }),
      });

      // This should complete quickly due to proper error handling
      const startTime = Date.now();
      const response = await POST(request);
      const endTime = Date.now();

      // Should not take too long (proper timeout handling)
      expect(endTime - startTime).toBeLessThan(5000);
      expect(response.status).toBeLessThanOrEqual(500);
    }, 15000);
  });
});
