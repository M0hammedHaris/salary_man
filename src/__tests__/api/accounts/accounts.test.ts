import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/accounts/route';
import { repositories } from '@/lib/db/repositories';

// Mock the entire modules to avoid type issues
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/db/repositories');

const mockAuth = vi.mocked((await import('@clerk/nextjs/server')).auth);
const mockRepo = vi.mocked(repositories.accounts);

describe('Account API Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/accounts', () => {
    it('returns 401 when user is not authenticated', async () => {
      // @ts-expect-error - Mocking partial auth response
      mockAuth.mockResolvedValue({ userId: null });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('returns user accounts successfully', async () => {
      const mockAccounts = [
        {
          id: '1',
          name: 'Test Account',
          type: 'checking' as const,
          balance: '1000.00',
          creditLimit: null,
          isActive: true,
          userId: 'user123',
          createdAt: new Date('2025-08-14T06:00:00.000Z'),
          updatedAt: new Date('2025-08-14T06:00:00.000Z'),
        },
      ];

      // @ts-expect-error - Mocking partial auth response
      mockAuth.mockResolvedValue({ userId: 'user123' });
      mockRepo.findByUserId.mockResolvedValue(mockAccounts);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.accounts).toHaveLength(1);
      expect(data.accounts[0].name).toBe('Test Account');
    });

    it('handles database errors gracefully', async () => {
      // @ts-expect-error - Mocking partial auth response
      mockAuth.mockResolvedValue({ userId: 'user123' });
      mockRepo.findByUserId.mockRejectedValue(new Error('Database error'));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch accounts');
    });
  });

  describe('POST /api/accounts', () => {
    it('creates account successfully with valid data', async () => {
      const mockAccount = {
        id: '1',
        userId: 'user123',
        name: 'New Account',
        type: 'checking' as const,
        balance: '1000.00',
        creditLimit: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // @ts-expect-error - Mocking partial auth response
      mockAuth.mockResolvedValue({ userId: 'user123' });
      mockRepo.create.mockResolvedValue(mockAccount);

      const request = new Request('http://localhost/api/accounts', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New Account',
          type: 'checking',
          balance: '1000.00',
        }),
        headers: { 'Content-Type': 'application/json' },
      }) as any; // Simplified for testing

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.account.name).toBe('New Account');
      expect(data.message).toBe('Account created successfully');
    });

    it('validates request data', async () => {
      // @ts-expect-error - Mocking partial auth response
      mockAuth.mockResolvedValue({ userId: 'user123' });

      const request = new Request('http://localhost/api/accounts', {
        method: 'POST',
        body: JSON.stringify({
          name: '', // Invalid: empty name
          type: 'checking',
          balance: 'invalid', // Invalid: non-numeric balance
        }),
        headers: { 'Content-Type': 'application/json' },
      }) as any; // Simplified for testing

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(data.details).toBeDefined();
    });
  });
});
