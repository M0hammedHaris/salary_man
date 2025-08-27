import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { GET, POST } from '@/app/api/bills/route';
import { BillService } from '@/lib/services/bill-service';
import { db } from '@/lib/db';

// Mock Clerk auth
vi.mock('@clerk/nextjs/server', () => ({
  getAuth: vi.fn(),
}));

// Mock BillService
vi.mock('@/lib/services/bill-service', () => ({
  BillService: {
    getUserBills: vi.fn(),
  },
}));

// Mock database
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockGetAuth = vi.mocked(getAuth);
const mockBillService = vi.mocked(BillService);
const mockDb = vi.mocked(db);

describe('/api/bills', () => {
  const mockUserId = 'user_2pQ7X8RjKl3mN5vP9tB2cF1hG6dA';
  const mockAccountId = '550e8400-e29b-41d4-a716-446655440001';
  const mockCategoryId = '550e8400-e29b-41d4-a716-446655440002';

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAuth.mockResolvedValue({ userId: mockUserId } as any);
  });

  describe('GET /api/bills', () => {
    it('should return user bills successfully', async () => {
      const mockBills = [
        {
          id: 'bill_test123',
          name: 'Electric Bill',
          amount: '150.00',
          frequency: 'monthly' as const,
          nextDueDate: new Date('2024-02-01'),
          status: 'pending' as const,
          reminderDays: '1,3,7',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: mockUserId,
          accountId: mockAccountId,
          categoryId: mockCategoryId,
          lastProcessed: null,
          paymentDate: null,
          account: {
            id: mockAccountId,
            name: 'Main Checking',
            type: 'checking' as const,
            balance: '1000.00',
            userId: mockUserId,
            institution: 'Test Bank',
            accountNumber: '12345',
            routingNumber: '987654321',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            creditLimit: null,
            interestRate: null,
            minimumPayment: null,
            statementDate: null,
            dueDate: null,
          },
        },
      ];

      mockBillService.getUserBills.mockResolvedValue(mockBills);

      const request = new NextRequest('http://localhost:3000/api/bills');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.bills).toHaveLength(1);
      expect(data.bills[0].name).toBe('Electric Bill');
      expect(data.pagination).toEqual({
        limit: 50,
        offset: 0,
        total: 1,
      });
    });

    it('should handle query parameters correctly', async () => {
      mockBillService.getUserBills.mockResolvedValue([]);

      const url = new URL('http://localhost:3000/api/bills?status=pending&limit=10&offset=5');
      const request = new NextRequest(url);
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.pagination.limit).toBe(10);
      expect(data.pagination.offset).toBe(5);
    });

    it('should return 401 for unauthorized requests', async () => {
      mockGetAuth.mockResolvedValue({ userId: null } as any);

      const request = new NextRequest('http://localhost:3000/api/bills');
      const response = await GET(request);

      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ error: 'Unauthorized' });
    });

    it('should handle invalid query parameters', async () => {
      const url = new URL('http://localhost:3000/api/bills?limit=invalid');
      const request = new NextRequest(url);
      const response = await GET(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Invalid query parameters');
    });
  });

  describe('POST /api/bills', () => {
    const validBillData = {
      accountId: mockAccountId,
      name: 'Internet Bill',
      amount: '75.50',
      frequency: 'monthly' as const,
      nextDueDate: '2024-02-15T00:00:00.000Z',
      categoryId: mockCategoryId,
      reminderDays: '1,3,7',
    };

    beforeEach(() => {
      // Mock account verification
      mockDb.select.mockImplementation(() => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              { id: mockAccountId, userId: mockUserId },
            ]),
          }),
        }),
      } as any));
    });

    it('should create a new bill successfully', async () => {
      const mockNewBill = {
        id: 'bill_new123',
        ...validBillData,
        userId: mockUserId,
        status: 'pending',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock category verification (second call)
      mockDb.select
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([
                { id: mockAccountId, userId: mockUserId },
              ]),
            }),
          }),
        } as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([
                { id: mockCategoryId, userId: mockUserId },
              ]),
            }),
          }),
        } as any);

      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockNewBill]),
        }),
      } as any);

      const request = new NextRequest('http://localhost:3000/api/bills', {
        method: 'POST',
        body: JSON.stringify(validBillData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.bill.name).toBe('Internet Bill');
      expect(data.message).toBe('Bill created successfully');
    });

    it('should return 401 for unauthorized requests', async () => {
      mockGetAuth.mockResolvedValue({ userId: null } as any);

      const request = new NextRequest('http://localhost:3000/api/bills', {
        method: 'POST',
        body: JSON.stringify(validBillData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ error: 'Unauthorized' });
    });

    it('should validate request data', async () => {
      const invalidData = {
        ...validBillData,
        amount: 'invalid-amount',
        frequency: 'invalid-frequency',
      };

      const request = new NextRequest('http://localhost:3000/api/bills', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Invalid request data');
      expect(data.details).toBeDefined();
    });

    it('should return 404 for non-existent account', async () => {
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]), // Empty array = account not found
          }),
        }),
      } as any);

      const request = new NextRequest('http://localhost:3000/api/bills', {
        method: 'POST',
        body: JSON.stringify(validBillData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('Account not found or not authorized');
    });

    it('should return 404 for non-existent category', async () => {
      // Mock account found, category not found
      mockDb.select
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([
                { id: mockAccountId, userId: mockUserId },
              ]),
            }),
          }),
        } as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]), // Empty array = category not found
            }),
          }),
        } as any);

      const request = new NextRequest('http://localhost:3000/api/bills', {
        method: 'POST',
        body: JSON.stringify(validBillData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('Category not found or not authorized');
    });
  });
});
