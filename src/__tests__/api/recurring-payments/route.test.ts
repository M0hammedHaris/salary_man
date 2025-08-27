import { describe, test, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { db } from '../../../lib/db';
import { 
  users, 
  accounts, 
  categories, 
  transactions,
  recurringPayments,
  type NewUser,
  type NewAccount,
  type NewCategory
} from '../../../lib/db/schema';
import { GET, POST } from '../../../app/api/recurring-payments/route';
import { PUT, DELETE } from '../../../app/api/recurring-payments/[id]/route';

// Mock Clerk auth
vi.mock('@clerk/nextjs/server', () => ({
  getAuth: vi.fn(),
}));

const mockGetAuth = vi.mocked(getAuth);

describe('API: /api/recurring-payments', () => {
  // Test data
  let testUserId: string;
  let testAccountId: string;
  let testCategoryId: string;

  beforeAll(async () => {
    // Create test user
    const testUser: NewUser = {
      id: 'test_user_recurring_api',
      email: 'test.api@example.com',
      firstName: 'API',
      lastName: 'User',
    };

    await db.insert(users).values(testUser);
    testUserId = testUser.id;

    // Create test account
    const testAccount: NewAccount = {
      userId: testUserId,
      name: 'Test Account',
      type: 'checking',
      balance: '10000.00',
    };

    const [account] = await db.insert(accounts).values(testAccount).returning();
    testAccountId = account.id;

    // Create test category
    const testCategory: NewCategory = {
      userId: testUserId,
      name: 'Test Category',
      type: 'expense',
      color: '#ff0000',
    };

    const [category] = await db.insert(categories).values(testCategory).returning();
    testCategoryId = category.id;

    // Mock auth to return test user
    mockGetAuth.mockResolvedValue({ userId: testUserId } as any);
  });

  afterAll(async () => {
    // Clean up test data
    await db.delete(recurringPayments).where(eq(recurringPayments.userId, testUserId));
    await db.delete(transactions).where(eq(transactions.userId, testUserId));
    await db.delete(categories).where(eq(categories.userId, testUserId));
    await db.delete(accounts).where(eq(accounts.userId, testUserId));
    await db.delete(users).where(eq(users.id, testUserId));
  });

  beforeEach(async () => {
    // Clean up recurring payments before each test
    await db.delete(recurringPayments).where(eq(recurringPayments.userId, testUserId));
  });

  describe('GET /api/recurring-payments', () => {
    test('should fetch user recurring payments', async () => {
      // Create test recurring payment
      await db.insert(recurringPayments).values({
        userId: testUserId,
        accountId: testAccountId,
        name: 'Test Subscription',
        amount: '999.00',
        frequency: 'monthly',
        nextDueDate: new Date(),
        categoryId: testCategoryId,
        isActive: true,
      });

      const request = new NextRequest('http://localhost:3000/api/recurring-payments');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.recurringPayments).toHaveLength(1);
      expect(data.recurringPayments[0].name).toBe('Test Subscription');
      expect(data.recurringPayments[0].amount).toBe('999.00');
    });

    test('should filter recurring payments by status', async () => {
      // Create recurring payments with different statuses
      await db.insert(recurringPayments).values([
        {
          userId: testUserId,
          accountId: testAccountId,
          name: 'Pending Payment',
          amount: '500.00',
          frequency: 'monthly',
          nextDueDate: new Date(),
          categoryId: testCategoryId,
          status: 'pending',
          isActive: true,
        },
        {
          userId: testUserId,
          accountId: testAccountId,
          name: 'Paid Payment',
          amount: '750.00',
          frequency: 'monthly',
          nextDueDate: new Date(),
          categoryId: testCategoryId,
          status: 'paid',
          isActive: true,
        },
      ]);

      const request = new NextRequest('http://localhost:3000/api/recurring-payments?status=pending');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.recurringPayments).toHaveLength(1);
      expect(data.recurringPayments[0].status).toBe('pending');
    });

    test('should return 401 for unauthenticated requests', async () => {
      mockGetAuth.mockResolvedValueOnce({ userId: null } as any);

      const request = new NextRequest('http://localhost:3000/api/recurring-payments');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/recurring-payments', () => {
    test('should create new recurring payment', async () => {
      const requestBody = {
        accountId: testAccountId,
        name: 'New Subscription',
        amount: '1299.00',
        frequency: 'monthly',
        nextDueDate: new Date().toISOString(),
        categoryId: testCategoryId,
        reminderDays: '1,3,7',
      };

      const request = new NextRequest('http://localhost:3000/api/recurring-payments', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });
      
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.recurringPayment.name).toBe('New Subscription');
      expect(data.recurringPayment.amount).toBe('1299.00');
      expect(data.message).toBe('Recurring payment created successfully');
    });

    test('should validate request data', async () => {
      const invalidRequestBody = {
        accountId: 'invalid-uuid',
        name: '',
        amount: 'invalid-amount',
        frequency: 'invalid-frequency',
      };

      const request = new NextRequest('http://localhost:3000/api/recurring-payments', {
        method: 'POST',
        body: JSON.stringify(invalidRequestBody),
      });
      
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request data');
      expect(data.details).toBeDefined();
    });

    test('should return 404 for non-existent account', async () => {
      const requestBody = {
        accountId: '123e4567-e89b-12d3-a456-426614174000', // Non-existent UUID
        name: 'Test Payment',
        amount: '500.00',
        frequency: 'monthly',
        nextDueDate: new Date().toISOString(),
        categoryId: testCategoryId,
      };

      const request = new NextRequest('http://localhost:3000/api/recurring-payments', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });
      
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Account not found or not authorized');
    });
  });

  describe('PUT /api/recurring-payments/[id]', () => {
    test('should update recurring payment', async () => {
      // Create test recurring payment
      const [createdPayment] = await db.insert(recurringPayments).values({
        userId: testUserId,
        accountId: testAccountId,
        name: 'Original Name',
        amount: '500.00',
        frequency: 'monthly',
        nextDueDate: new Date(),
        categoryId: testCategoryId,
        isActive: true,
      }).returning();

      const updateData = {
        name: 'Updated Name',
        amount: '750.00',
        frequency: 'weekly' as const,
      };

      const request = new NextRequest(`http://localhost:3000/api/recurring-payments/${createdPayment.id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
      
      const response = await PUT(request, { params: { id: createdPayment.id } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.recurringPayment.name).toBe('Updated Name');
      expect(data.recurringPayment.amount).toBe('750.00');
      expect(data.recurringPayment.frequency).toBe('weekly');
    });

    test('should return 404 for non-existent payment', async () => {
      const updateData = {
        name: 'Updated Name',
      };

      const request = new NextRequest(`http://localhost:3000/api/recurring-payments/non-existent-id`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
      
      const response = await PUT(request, { params: { id: 'non-existent-id' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Recurring payment not found or not authorized');
    });
  });

  describe('DELETE /api/recurring-payments/[id]', () => {
    test('should cancel recurring payment', async () => {
      // Create test recurring payment
      const [createdPayment] = await db.insert(recurringPayments).values({
        userId: testUserId,
        accountId: testAccountId,
        name: 'Payment to Cancel',
        amount: '500.00',
        frequency: 'monthly',
        nextDueDate: new Date(),
        categoryId: testCategoryId,
        isActive: true,
      }).returning();

      const request = new NextRequest(`http://localhost:3000/api/recurring-payments/${createdPayment.id}`, {
        method: 'DELETE',
      });
      
      const response = await DELETE(request, { params: { id: createdPayment.id } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.recurringPayment.isActive).toBe(false);
      expect(data.message).toBe('Recurring payment cancelled successfully');
    });

    test('should return 404 for non-existent payment', async () => {
      const request = new NextRequest(`http://localhost:3000/api/recurring-payments/non-existent-id`, {
        method: 'DELETE',
      });
      
      const response = await DELETE(request, { params: { id: 'non-existent-id' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Recurring payment not found or not authorized');
    });
  });
});
