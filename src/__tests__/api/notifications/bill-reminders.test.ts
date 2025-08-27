import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as billReminderEmailPOST } from '../../../app/api/notifications/bill-reminder-email/route';
import { POST as billReminderPushPOST } from '../../../app/api/notifications/bill-reminder-push/route';
import { POST as inAppPOST } from '../../../app/api/notifications/in-app/route';
import { auth } from '@clerk/nextjs/server';

// Mock Clerk auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

describe('Bill Reminder Notification API Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful auth
    vi.mocked(auth).mockResolvedValue({ userId: 'user-1' } as any);

    // Mock console methods to avoid test output
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('POST /api/notifications/bill-reminder-email', () => {
    it('should successfully send bill reminder email', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: 'user_123' } as any);

      const requestBody = {
        title: 'Electric Bill Payment Reminder',
        message: 'Your Electric Bill payment of ₹150.00 is due on 2024-01-15.',
        type: 'warning' as const,
        billId: 'bill_123',
        billName: 'Electric Bill',
        dueDate: '2024-01-15',
        amount: '150.00',
        daysUntilDue: 3,
        notificationType: 'bill_reminder' as const,
      };

      const request = new NextRequest('http://localhost:3000/api/notifications/bill-reminder-email', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await billReminderEmailPOST(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.message).toBe('Bill reminder email notification queued successfully');
    });

    it('should return 401 when user is not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null } as any);

      const request = new NextRequest('http://localhost:3000/api/notifications/bill-reminder-email', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await billReminderEmailPOST(request);

      expect(response.status).toBe(401);
    });

    it('should return 400 for invalid request body', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: 'user_123' } as any);

      const request = new NextRequest('http://localhost:3000/api/notifications/bill-reminder-email', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await billReminderEmailPOST(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toBe('Invalid request data');
    });
  });

  describe('POST /api/notifications/bill-reminder-push', () => {
    it('should successfully send push notification', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: 'user_123' } as any);

      const requestBody = {
        title: 'Electric Bill Payment Reminder',
        message: 'Your Electric Bill payment of ₹150.00 is due on 2024-01-15.',
        type: 'warning' as const,
        icon: '/icons/bill-notification.png',
        tag: 'bill-reminder-123',
        data: {
          url: '/bills/bill_123',
          billId: 'bill_123',
          billName: 'Electric Bill',
          dueDate: '2024-01-15',
          notificationType: 'bill_reminder',
        },
      };

      const request = new NextRequest('http://localhost:3000/api/notifications/bill-reminder-push', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await billReminderPushPOST(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.message).toBe('Bill reminder push notification queued successfully');
    });

    it('should return 401 when user is not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null } as any);

      const request = new NextRequest('http://localhost:3000/api/notifications/bill-reminder-push', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await billReminderPushPOST(request);

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/notifications/in-app', () => {
    it('should successfully create in-app notification', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: 'user_123' } as any);

      const requestBody = {
        title: 'Electric Bill Payment Reminder',
        message: 'Your Electric Bill payment of ₹150.00 is due on 2024-01-15.',
        type: 'warning' as const,
        billId: 'bill_123',
        billName: 'Electric Bill',
        dueDate: '2024-01-15',
        amount: '150.00',
        daysUntilDue: 3,
        notificationType: 'bill_reminder' as const,
        priority: 'high' as const,
      };

      const request = new NextRequest('http://localhost:3000/api/notifications/in-app', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await inAppPOST(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.message).toBe('In-app notification processed successfully');
    });

    it('should handle missing optional fields gracefully', async () => {
      const requestBody = {
        title: 'Simple Notification',
        message: 'Simple message',
        type: 'info',
      };

      const request = new NextRequest('http://localhost:3000/api/notifications/in-app', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await inAppPOST(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
    });

    it('should return 401 when user is not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null } as any);

      const request = new NextRequest('http://localhost:3000/api/notifications/in-app', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await inAppPOST(request);

      expect(response.status).toBe(401);
    });
  });

  describe('Notification Data Validation', () => {
    it('should validate bill reminder specific fields correctly', async () => {
      const validRequestBody = {
        title: 'Valid Bill Reminder',
        message: 'Valid message for bill reminder',
        type: 'warning',
        billId: 'bill-123',
        billName: 'Test Bill',
        dueDate: '2025-08-30T00:00:00.000Z',
        amount: '100.50',
        daysUntilDue: 3,
        notificationType: 'bill_reminder',
      };

      const request = new NextRequest('http://localhost:3000/api/notifications/bill-reminder-email', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await billReminderEmailPOST(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
    });

    it('should reject invalid notification type enum', async () => {
      const invalidRequestBody = {
        title: 'Test Notification',
        message: 'Test message',
        type: 'warning',
        notificationType: 'invalid_type', // Invalid enum value
      };

      const request = new NextRequest('http://localhost:3000/api/notifications/bill-reminder-email', {
        method: 'POST',
        body: JSON.stringify(invalidRequestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await billReminderEmailPOST(request);

      expect(response.status).toBe(400);
    });

    it('should handle malformed JSON gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/notifications/in-app', {
        method: 'POST',
        body: 'invalid json {',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await inAppPOST(request);

      expect(response.status).toBe(500);
    });
  });
});
