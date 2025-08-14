import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { repositories } from '@/lib/db/repositories';
import { db } from '@/lib/db';
import { accounts } from '@/lib/db/schema';

// Mock the database connection for unit tests
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    query: {
      accounts: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      transactions: {
        findFirst: vi.fn(),
      },
    },
  },
}));

const mockDb = vi.mocked(db);

describe('AccountRepository Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('findByUserId', () => {
    it('returns user accounts with calculated balances', async () => {
      const mockAccountsData = [
        {
          id: '1',
          name: 'Test Account',
          type: 'checking' as const,
          balance: '1000.00',
          creditLimit: null,
          isActive: true,
          userId: 'user123',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockDb.query.accounts.findMany.mockResolvedValue(mockAccountsData);

      const result = await repositories.accounts.findByUserId('user123');

      expect(result).toEqual(mockAccountsData);
      expect(mockDb.query.accounts.findMany).toHaveBeenCalledWith({
        where: expect.any(Function),
        orderBy: expect.any(Function),
      });
    });

    it('returns empty array when no accounts found', async () => {
      mockDb.query.accounts.findMany.mockResolvedValue([]);

      const result = await repositories.accounts.findByUserId('user123');

      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    it('creates new account with valid data', async () => {
      const accountData = {
        name: 'New Account',
        type: 'checking' as const,
        balance: '1000.00',
        creditLimit: null,
        isActive: true,
        userId: 'user123',
      };

      const createdAccount = {
        id: '1',
        ...accountData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockInsert = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([createdAccount]),
      };
      mockDb.insert.mockReturnValue(mockInsert);

      const result = await repositories.accounts.create(accountData);

      expect(result).toEqual(createdAccount);
      expect(mockDb.insert).toHaveBeenCalledWith(accounts);
      expect(mockInsert.values).toHaveBeenCalledWith(accountData);
    });

    it('handles credit card accounts with credit limit', async () => {
      const accountData = {
        name: 'Credit Card',
        type: 'credit_card' as const,
        balance: '0.00',
        creditLimit: '5000.00',
        isActive: true,
        userId: 'user123',
      };

      const createdAccount = {
        id: '1',
        ...accountData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockInsert = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([createdAccount]),
      };
      mockDb.insert.mockReturnValue(mockInsert);

      const result = await repositories.accounts.create(accountData);

      expect(result).toEqual(createdAccount);
      expect(result.creditLimit).toBe('5000.00');
    });
  });

  describe('findById', () => {
    it('returns account when found', async () => {
      const mockAccount = {
        id: '1',
        name: 'Test Account',
        type: 'checking' as const,
        balance: '1000.00',
        creditLimit: null,
        isActive: true,
        userId: 'user123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb.query.accounts.findFirst.mockResolvedValue(mockAccount);

      const result = await repositories.accounts.findById('1', 'user123');

      expect(result).toEqual(mockAccount);
      expect(mockDb.query.accounts.findFirst).toHaveBeenCalledWith({
        where: expect.any(Function),
      });
    });

    it('returns null when account not found', async () => {
      mockDb.query.accounts.findFirst.mockResolvedValue(undefined);

      const result = await repositories.accounts.findById('999', 'user123');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('updates account successfully', async () => {
      const updatedAccount = {
        id: '1',
        name: 'Updated Account',
        type: 'checking' as const,
        balance: '1000.00',
        creditLimit: null,
        isActive: true,
        userId: 'user123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockUpdate = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([updatedAccount]),
      };
      mockDb.update.mockReturnValue(mockUpdate);

      const updateData = { name: 'Updated Account' };
      const result = await repositories.accounts.update('1', 'user123', updateData);

      expect(result).toEqual(updatedAccount);
      expect(mockDb.update).toHaveBeenCalledWith(accounts);
      expect(mockUpdate.set).toHaveBeenCalledWith({
        ...updateData,
        updatedAt: expect.any(Date),
      });
    });
  });

  describe('delete', () => {
    it('deletes account successfully', async () => {
      const mockDelete = {
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{ id: '1' }]),
      };
      mockDb.delete.mockReturnValue(mockDelete);

      const result = await repositories.accounts.delete('1', 'user123');

      expect(result).toBe(true);
      expect(mockDb.delete).toHaveBeenCalledWith(accounts);
    });

    it('returns false when account not found', async () => {
      const mockDelete = {
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([]),
      };
      mockDb.delete.mockReturnValue(mockDelete);

      const result = await repositories.accounts.delete('999', 'user123');

      expect(result).toBe(false);
    });
  });

  describe('hasTransactions', () => {
    it('returns true when account has transactions', async () => {
      const mockTransaction = {
        id: '1',
        amount: '100.00',
        accountId: '1',
      };

      mockDb.query.transactions.findFirst.mockResolvedValue(mockTransaction);

      const result = await repositories.accounts.hasTransactions('1', 'user123');

      expect(result).toBe(true);
    });

    it('returns false when account has no transactions', async () => {
      mockDb.query.transactions.findFirst.mockResolvedValue(undefined);

      const result = await repositories.accounts.hasTransactions('1', 'user123');

      expect(result).toBe(false);
    });
  });

  describe('calculateBalance', () => {
    it('calculates balance from transactions correctly', async () => {
      const mockTransactions = [
        { amount: '100.00', type: 'income' },
        { amount: '-50.00', type: 'expense' },
        { amount: '25.00', type: 'income' },
      ];

      // Mock the SQL query result
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        then: vi.fn().mockResolvedValue(mockTransactions),
      };
      mockDb.select.mockReturnValue(mockSelect);

      const result = await repositories.accounts.calculateBalance('1');

      expect(result).toBe('75.00');
    });

    it('returns 0.00 when no transactions exist', async () => {
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        then: vi.fn().mockResolvedValue([]),
      };
      mockDb.select.mockReturnValue(mockSelect);

      const result = await repositories.accounts.calculateBalance('1');

      expect(result).toBe('0.00');
    });
  });

  describe('updateAccountBalance', () => {
    it('updates account balance after recalculation', async () => {
      // Mock calculateBalance method
      const calculateSpy = vi.spyOn(repositories.accounts, 'calculateBalance');
      calculateSpy.mockResolvedValue('150.00');

      const mockUpdate = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{
          id: '1',
          balance: '150.00',
          updatedAt: new Date(),
        }]),
      };
      mockDb.update.mockReturnValue(mockUpdate);

      const result = await repositories.accounts.updateAccountBalance('1');

      expect(calculateSpy).toHaveBeenCalledWith('1');
      expect(result).toBe('150.00');
      expect(mockUpdate.set).toHaveBeenCalledWith({
        balance: '150.00',
        updatedAt: expect.any(Date),
      });

      calculateSpy.mockRestore();
    });
  });
});
