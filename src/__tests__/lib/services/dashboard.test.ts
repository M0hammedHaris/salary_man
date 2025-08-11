import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getDashboardData } from '@/lib/services/dashboard';
import { repositories } from '@/lib/db/repositories';
import { Decimal } from 'decimal.js';

// Mock the repositories
vi.mock('@/lib/db/repositories', () => ({
  repositories: {
    users: {
      findById: vi.fn(),
    },
    accounts: {
      findByUserId: vi.fn(),
    },
    transactions: {
      findByUserId: vi.fn(),
    },
    categories: {
      findByUserId: vi.fn(),
    },
  },
}));

describe('Dashboard Service', () => {
  const mockUserId = 'test-user-id';
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockUser = {
    id: mockUserId,
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    preferences: {
      currency: 'USD',
      dateFormat: 'MM/dd/yyyy',
      alertThresholds: {
        creditCard: 80,
        lowBalance: 100,
      },
      notifications: {
        email: true,
        push: true,
        sms: false,
      },
    },
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  };

  const mockAccounts = [
    {
      id: 'account-1',
      userId: mockUserId,
      name: 'Checking Account',
      type: 'checking' as const,
      balance: '1000.00',
      creditLimit: null,
      isActive: true,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
    },
    {
      id: 'account-2',
      userId: mockUserId,
      name: 'Credit Card',
      type: 'credit_card' as const,
      balance: '-500.00',
      creditLimit: '2000.00',
      isActive: true,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
    },
  ];

  const mockTransactions = [
    {
      id: 'transaction-1',
      userId: mockUserId,
      accountId: 'account-1',
      amount: '-50.00',
      description: 'Grocery Store',
      categoryId: 'category-1',
      transactionDate: new Date('2023-12-01'),
      isRecurring: false,
      recurringPaymentId: null,
      receiptUrl: null,
      createdAt: new Date('2023-12-01'),
      updatedAt: new Date('2023-12-01'),
    },
  ];

  const mockCategories = [
    {
      id: 'category-1',
      userId: mockUserId,
      name: 'Groceries',
      type: 'expense' as const,
      color: '#22c55e',
      isDefault: false,
      parentId: null,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
    },
  ];

  it('should fetch and process dashboard data successfully', async () => {
    // Mock repository responses
    vi.mocked(repositories.users.findById).mockResolvedValue(mockUser);
    vi.mocked(repositories.accounts.findByUserId).mockResolvedValue(mockAccounts);
    vi.mocked(repositories.transactions.findByUserId).mockResolvedValue(mockTransactions);
    vi.mocked(repositories.categories.findByUserId).mockResolvedValue(mockCategories);

    const result = await getDashboardData(mockUserId);

    expect(result).toBeDefined();
    expect(result.financialHealthScore).toBeDefined();
    expect(result.financialHealthScore.score).toBeGreaterThanOrEqual(0);
    expect(result.financialHealthScore.score).toBeLessThanOrEqual(100);
    expect(result.financialHealthScore.trend).toMatch(/^(up|down|stable)$/);
    
    expect(result.accountSummary).toBeDefined();
    expect(result.accountSummary.totalBalance).toBe(500); // Correctly expect number, not Decimal
    expect(result.accountSummary.accounts).toHaveLength(2);
    
    expect(result.creditCardUtilization).toBeDefined();
    expect(result.creditCardUtilization).toHaveLength(1); // Only credit card account
    
    expect(result.recentTransactions).toBeDefined();
    expect(result.recentTransactions).toHaveLength(1);
    
    expect(result.alerts).toBeDefined();
    expect(Array.isArray(result.alerts)).toBe(true);
  });

  it('should calculate account balances correctly', async () => {
    vi.mocked(repositories.users.findById).mockResolvedValue(mockUser);
    vi.mocked(repositories.accounts.findByUserId).mockResolvedValue(mockAccounts);
    vi.mocked(repositories.transactions.findByUserId).mockResolvedValue(mockTransactions);
    vi.mocked(repositories.categories.findByUserId).mockResolvedValue(mockCategories);

    const result = await getDashboardData(mockUserId);

    expect(result.accountSummary.checkingBalance).toBe(1000);
    expect(result.accountSummary.savingsBalance).toBe(0);
    expect(result.accountSummary.creditCardBalance).toBe(-500);
    expect(result.accountSummary.totalBalance).toBe(500); // 1000 + (-500)
  });

  it('should calculate credit card utilization correctly', async () => {
    vi.mocked(repositories.users.findById).mockResolvedValue(mockUser);
    vi.mocked(repositories.accounts.findByUserId).mockResolvedValue(mockAccounts);
    vi.mocked(repositories.transactions.findByUserId).mockResolvedValue(mockTransactions);
    vi.mocked(repositories.categories.findByUserId).mockResolvedValue(mockCategories);

    const result = await getDashboardData(mockUserId);

    expect(result.creditCardUtilization).toHaveLength(1);
    expect(result.creditCardUtilization[0].utilization).toBe(25); // 500/2000 * 100 = 25%
    expect(result.creditCardUtilization[0].status).toBe('good'); // <30% is good
  });

  it('should generate appropriate alerts', async () => {
    const lowBalanceUser = {
      ...mockUser,
      preferences: {
        ...mockUser.preferences,
        alertThresholds: {
          creditCard: 30,
          lowBalance: 1500, // Higher than checking balance
        },
      },
    };

    vi.mocked(repositories.users.findById).mockResolvedValue(lowBalanceUser);
    vi.mocked(repositories.accounts.findByUserId).mockResolvedValue(mockAccounts);
    vi.mocked(repositories.transactions.findByUserId).mockResolvedValue(mockTransactions);
    vi.mocked(repositories.categories.findByUserId).mockResolvedValue(mockCategories);

    const result = await getDashboardData(mockUserId);

    expect(result.alerts.length).toBeGreaterThan(0);
    const lowBalanceAlert = result.alerts.find(alert => alert.message.includes('Low balance'));
    expect(lowBalanceAlert).toBeDefined();
  });

  it('should handle missing user error', async () => {
    vi.mocked(repositories.users.findById).mockResolvedValue(null);

    await expect(getDashboardData(mockUserId)).rejects.toThrow('Failed to fetch dashboard data');
  });

  it('should process recent transactions with category information', async () => {
    vi.mocked(repositories.users.findById).mockResolvedValue(mockUser);
    vi.mocked(repositories.accounts.findByUserId).mockResolvedValue(mockAccounts);
    vi.mocked(repositories.transactions.findByUserId).mockResolvedValue(mockTransactions);
    vi.mocked(repositories.categories.findByUserId).mockResolvedValue(mockCategories);

    const result = await getDashboardData(mockUserId);

    expect(result.recentTransactions).toHaveLength(1);
    expect(result.recentTransactions[0].categoryName).toBe('Groceries');
    expect(result.recentTransactions[0].categoryColor).toBe('#22c55e');
    expect(result.recentTransactions[0].accountName).toBe('Checking Account');
    expect(result.recentTransactions[0].amount).toBe(-50); // Correctly expect number, not Decimal
  });

  it('should calculate financial health score based on factors', async () => {
    vi.mocked(repositories.users.findById).mockResolvedValue(mockUser);
    vi.mocked(repositories.accounts.findByUserId).mockResolvedValue(mockAccounts);
    vi.mocked(repositories.transactions.findByUserId).mockResolvedValue(mockTransactions);
    vi.mocked(repositories.categories.findByUserId).mockResolvedValue(mockCategories);

    const result = await getDashboardData(mockUserId);

    // Should have a reasonable score based on positive balance, low utilization, and activity
    expect(result.financialHealthScore.score).toBeGreaterThan(60);
    expect(result.financialHealthScore.explanation).toContain('account balances');
    expect(result.financialHealthScore.explanation).toContain('credit utilization');
  });
});
