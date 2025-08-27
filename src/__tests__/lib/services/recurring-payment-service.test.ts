import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { addDays, subDays, addMonths } from 'date-fns';
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
  type NewCategory,
  type NewTransaction
} from '../../../lib/db/schema';
import { RecurringPaymentService } from '../../../lib/services/recurring-payment-service';

describe('RecurringPaymentService - Pattern Detection', () => {
  // Test data
  let testUserId: string;
  let testAccountId: string;
  let testCategoryId: string;

  beforeAll(async () => {
    // Create test user
    const testUser: NewUser = {
      id: 'test_user_recurring_patterns',
      email: 'test.recurring@example.com',
      firstName: 'Test',
      lastName: 'User',
    };

    await db.insert(users).values(testUser);
    testUserId = testUser.id;

    // Create test account
    const testAccount: NewAccount = {
      userId: testUserId,
      name: 'Test Checking Account',
      type: 'checking',
      balance: '10000.00',
    };

    const [account] = await db.insert(accounts).values(testAccount).returning();
    testAccountId = account.id;

    // Create test category
    const testCategory: NewCategory = {
      userId: testUserId,
      name: 'Subscriptions',
      type: 'expense',
      color: '#ff0000',
    };

    const [category] = await db.insert(categories).values(testCategory).returning();
    testCategoryId = category.id;
  });

  afterAll(async () => {
    // Clean up test data
    await db.delete(transactions).where(eq(transactions.userId, testUserId));
    await db.delete(recurringPayments).where(eq(recurringPayments.userId, testUserId));
    await db.delete(categories).where(eq(categories.userId, testUserId));
    await db.delete(accounts).where(eq(accounts.userId, testUserId));
    await db.delete(users).where(eq(users.id, testUserId));
  });

  beforeEach(async () => {
    // Clean up transactions and recurring payments before each test
    await db.delete(transactions).where(eq(transactions.userId, testUserId));
    await db.delete(recurringPayments).where(eq(recurringPayments.userId, testUserId));
  });

  test('should detect monthly subscription pattern', async () => {
    // Create monthly Netflix subscription pattern
    const baseDate = subDays(new Date(), 120); // 4 months ago
    const netflixTransactions: NewTransaction[] = [];

    for (let i = 0; i < 4; i++) {
      const transactionDate = addMonths(baseDate, i);
      netflixTransactions.push({
        userId: testUserId,
        accountId: testAccountId,
        amount: '-599.00', // Netflix subscription amount
        description: 'Netflix Subscription',
        categoryId: testCategoryId,
        transactionDate,
        isRecurring: false,
      });
    }

    await db.insert(transactions).values(netflixTransactions);

    // Detect patterns
    const detectedPatterns = await RecurringPaymentService.detectRecurringPatterns(testUserId);

    expect(detectedPatterns).toHaveLength(1);
    expect(detectedPatterns[0].pattern.frequency).toBe('monthly');
    expect(detectedPatterns[0].pattern.averageAmount.toString()).toBe('599');
    expect(detectedPatterns[0].pattern.confidence).toBeGreaterThan(0.7);
    expect(detectedPatterns[0].isNewPattern).toBe(true);
    expect(detectedPatterns[0].suggestedName).toContain('Netflix');
  });

  test('should detect weekly grocery pattern', async () => {
    // Create weekly grocery shopping pattern
    const baseDate = subDays(new Date(), 56); // 8 weeks ago
    const groceryTransactions: NewTransaction[] = [];

    for (let i = 0; i < 8; i++) {
      const transactionDate = addDays(baseDate, i * 7);
      const amount = (2500 + (Math.random() * 500 - 250)).toFixed(2); // 2250-2750 range
      groceryTransactions.push({
        userId: testUserId,
        accountId: testAccountId,
        amount: `-${amount}`,
        description: 'BigBasket Groceries Order',
        categoryId: testCategoryId,
        transactionDate,
        isRecurring: false,
      });
    }

    await db.insert(transactions).values(groceryTransactions);

    // Detect patterns with more tolerance for weekly patterns
    const detectedPatterns = await RecurringPaymentService.detectRecurringPatterns(testUserId, {
      amountTolerancePercent: 15, // Higher tolerance for grocery amounts
      dateVarianceDays: 2,
    });

    expect(detectedPatterns).toHaveLength(1);
    expect(detectedPatterns[0].pattern.frequency).toBe('weekly');
    expect(detectedPatterns[0].pattern.confidence).toBeGreaterThan(0.6);
    expect(detectedPatterns[0].suggestedName).toContain('Bigbasket');
  });

  test('should not detect patterns with insufficient occurrences', async () => {
    // Create only 2 transactions (below minimum of 3)
    const baseDate = subDays(new Date(), 60);
    const insufficientTransactions: NewTransaction[] = [
      {
        userId: testUserId,
        accountId: testAccountId,
        amount: '-1999.00',
        description: 'Spotify Premium',
        categoryId: testCategoryId,
        transactionDate: baseDate,
        isRecurring: false,
      },
      {
        userId: testUserId,
        accountId: testAccountId,
        amount: '-1999.00',
        description: 'Spotify Premium',
        categoryId: testCategoryId,
        transactionDate: addMonths(baseDate, 1),
        isRecurring: false,
      },
    ];

    await db.insert(transactions).values(insufficientTransactions);

    const detectedPatterns = await RecurringPaymentService.detectRecurringPatterns(testUserId);

    expect(detectedPatterns).toHaveLength(0);
  });

  test('should detect quarterly patterns', async () => {
    // Create quarterly software license pattern
    const baseDate = subDays(new Date(), 365); // 1 year ago
    const quarterlyTransactions: NewTransaction[] = [];

    for (let i = 0; i < 4; i++) {
      const transactionDate = addMonths(baseDate, i * 3);
      quarterlyTransactions.push({
        userId: testUserId,
        accountId: testAccountId,
        amount: '-15000.00', // Quarterly software license
        description: 'Adobe Creative Suite License',
        categoryId: testCategoryId,
        transactionDate,
        isRecurring: false,
      });
    }

    await db.insert(transactions).values(quarterlyTransactions);

    const detectedPatterns = await RecurringPaymentService.detectRecurringPatterns(testUserId);

    expect(detectedPatterns).toHaveLength(1);
    expect(detectedPatterns[0].pattern.frequency).toBe('quarterly');
    expect(detectedPatterns[0].pattern.averageAmount.toString()).toBe('15000');
    expect(detectedPatterns[0].suggestedName).toContain('Adobe');
  });

  test('should handle amount variations within tolerance', async () => {
    // Create pattern with slight amount variations
    const baseDate = subDays(new Date(), 90);
    const variableTransactions: NewTransaction[] = [
      {
        userId: testUserId,
        accountId: testAccountId,
        amount: '-2500.00',
        description: 'Internet Bill',
        categoryId: testCategoryId,
        transactionDate: baseDate,
        isRecurring: false,
      },
      {
        userId: testUserId,
        accountId: testAccountId,
        amount: '-2450.00', // 2% variation
        description: 'Internet Bill',
        categoryId: testCategoryId,
        transactionDate: addMonths(baseDate, 1),
        isRecurring: false,
      },
      {
        userId: testUserId,
        accountId: testAccountId,
        amount: '-2550.00', // 2% variation
        description: 'Internet Bill',
        categoryId: testCategoryId,
        transactionDate: addMonths(baseDate, 2),
        isRecurring: false,
      },
    ];

    await db.insert(transactions).values(variableTransactions);

    const detectedPatterns = await RecurringPaymentService.detectRecurringPatterns(testUserId, {
      amountTolerancePercent: 5, // Should accept 2% variation
    });

    expect(detectedPatterns).toHaveLength(1);
    expect(detectedPatterns[0].pattern.confidence).toBeGreaterThan(0.6);
  });

  test('should not detect patterns with too much amount variation', async () => {
    // Create transactions with excessive amount variations
    const baseDate = subDays(new Date(), 90);
    const excessiveVariationTransactions: NewTransaction[] = [
      {
        userId: testUserId,
        accountId: testAccountId,
        amount: '-1000.00',
        description: 'Variable Service',
        categoryId: testCategoryId,
        transactionDate: baseDate,
        isRecurring: false,
      },
      {
        userId: testUserId,
        accountId: testAccountId,
        amount: '-2000.00', // 100% increase
        description: 'Variable Service',
        categoryId: testCategoryId,
        transactionDate: addMonths(baseDate, 1),
        isRecurring: false,
      },
      {
        userId: testUserId,
        accountId: testAccountId,
        amount: '-500.00', // 50% of original
        description: 'Variable Service',
        categoryId: testCategoryId,
        transactionDate: addMonths(baseDate, 2),
        isRecurring: false,
      },
    ];

    await db.insert(transactions).values(excessiveVariationTransactions);

    const detectedPatterns = await RecurringPaymentService.detectRecurringPatterns(testUserId, {
      amountTolerancePercent: 5, // Strict tolerance
      confidenceThreshold: 0.6,
    });

    // Should not detect pattern due to excessive amount variation
    expect(detectedPatterns).toHaveLength(0);
  });

  test('should identify existing recurring payments', async () => {
    // Create an existing recurring payment
    const existingPayment = await db.insert(recurringPayments).values({
      userId: testUserId,
      accountId: testAccountId,
      name: 'Existing Netflix Subscription',
      amount: '599.00',
      frequency: 'monthly',
      nextDueDate: new Date(),
      categoryId: testCategoryId,
      isActive: true,
    }).returning();

    // Create matching transaction pattern
    const baseDate = subDays(new Date(), 90);
    const matchingTransactions: NewTransaction[] = [];

    for (let i = 0; i < 3; i++) {
      matchingTransactions.push({
        userId: testUserId,
        accountId: testAccountId,
        amount: '-599.00',
        description: 'Netflix Subscription Payment',
        categoryId: testCategoryId,
        transactionDate: addMonths(baseDate, i),
        isRecurring: false,
      });
    }

    await db.insert(transactions).values(matchingTransactions);

    const detectedPatterns = await RecurringPaymentService.detectRecurringPatterns(testUserId);

    expect(detectedPatterns).toHaveLength(1);
    expect(detectedPatterns[0].existingPaymentId).toBe(existingPayment[0].id);
    expect(detectedPatterns[0].isNewPattern).toBe(false);
  });

  test('should calculate risk scores correctly', async () => {
    // Create high-risk pattern (large amount, recent, few occurrences)
    const baseDate = subDays(new Date(), 30); // Recent pattern
    const highRiskTransactions: NewTransaction[] = [];

    for (let i = 0; i < 3; i++) {
      highRiskTransactions.push({
        userId: testUserId,
        accountId: testAccountId,
        amount: '-50000.00', // Large amount
        description: 'Expensive Service',
        categoryId: testCategoryId,
        transactionDate: addDays(baseDate, i * 10),
        isRecurring: false,
      });
    }

    await db.insert(transactions).values(highRiskTransactions);

    const detectedPatterns = await RecurringPaymentService.detectRecurringPatterns(testUserId, {
      confidenceThreshold: 0.3, // Lower threshold to detect this risky pattern
    });

    expect(detectedPatterns).toHaveLength(1);
    expect(detectedPatterns[0].riskScore).toBeGreaterThan(0.5); // High risk
  });
});

describe('RecurringPaymentService - Cost Analysis', () => {
  let testUserId: string;
  let testAccountId: string;
  let testCategoryId: string;

  beforeAll(async () => {
    // Create test user
    const testUser: NewUser = {
      id: 'test_user_cost_analysis',
      email: 'test.cost@example.com',
      firstName: 'Cost',
      lastName: 'User',
    };

    await db.insert(users).values(testUser);
    testUserId = testUser.id;

    // Create test account
    const testAccount: NewAccount = {
      userId: testUserId,
      name: 'Test Account',
      type: 'checking',
      balance: '50000.00',
    };

    const [account] = await db.insert(accounts).values(testAccount).returning();
    testAccountId = account.id;

    // Create test category
    const testCategory: NewCategory = {
      userId: testUserId,
      name: 'Test Category',
      type: 'expense',
      color: '#00ff00',
    };

    const [category] = await db.insert(categories).values(testCategory).returning();
    testCategoryId = category.id;
  });

  afterAll(async () => {
    // Clean up test data
    await db.delete(recurringPayments).where(eq(recurringPayments.userId, testUserId));
    await db.delete(categories).where(eq(categories.userId, testUserId));
    await db.delete(accounts).where(eq(accounts.userId, testUserId));
    await db.delete(users).where(eq(users.id, testUserId));
  });

  beforeEach(async () => {
    // Clean up recurring payments before each test
    await db.delete(recurringPayments).where(eq(recurringPayments.userId, testUserId));
  });

  test('should calculate total recurring costs correctly', async () => {
    // Create various recurring payments
    const recurringPaymentsData = [
      {
        userId: testUserId,
        accountId: testAccountId,
        name: 'Monthly Subscription',
        amount: '1000.00',
        frequency: 'monthly' as const,
        nextDueDate: new Date(),
        categoryId: testCategoryId,
        isActive: true,
      },
      {
        userId: testUserId,
        accountId: testAccountId,
        name: 'Weekly Service',
        amount: '500.00',
        frequency: 'weekly' as const,
        nextDueDate: new Date(),
        categoryId: testCategoryId,
        isActive: true,
      },
      {
        userId: testUserId,
        accountId: testAccountId,
        name: 'Annual License',
        amount: '12000.00',
        frequency: 'yearly' as const,
        nextDueDate: new Date(),
        categoryId: testCategoryId,
        isActive: true,
      },
    ];

    await db.insert(recurringPayments).values(recurringPaymentsData);

    const costAnalysis = await RecurringPaymentService.getCostAnalysis(testUserId);

    // Expected monthly total:
    // Monthly: 1000
    // Weekly: 500 * 52/12 = ~2166.67
    // Yearly: 12000/12 = 1000
    // Total: ~4166.67

    expect(costAnalysis.totalRecurringCosts.monthly.toNumber()).toBeCloseTo(4166.67, 2);
    expect(costAnalysis.totalRecurringCosts.quarterly.toNumber()).toBeCloseTo(12500, 2);
    expect(costAnalysis.totalRecurringCosts.yearly.toNumber()).toBeCloseTo(50000, 2);
  });

  test('should provide frequency breakdown', async () => {
    const recurringPaymentsData = [
      {
        userId: testUserId,
        accountId: testAccountId,
        name: 'Monthly 1',
        amount: '1000.00',
        frequency: 'monthly' as const,
        nextDueDate: new Date(),
        categoryId: testCategoryId,
        isActive: true,
      },
      {
        userId: testUserId,
        accountId: testAccountId,
        name: 'Monthly 2',
        amount: '2000.00',
        frequency: 'monthly' as const,
        nextDueDate: new Date(),
        categoryId: testCategoryId,
        isActive: true,
      },
      {
        userId: testUserId,
        accountId: testAccountId,
        name: 'Weekly 1',
        amount: '500.00',
        frequency: 'weekly' as const,
        nextDueDate: new Date(),
        categoryId: testCategoryId,
        isActive: true,
      },
    ];

    await db.insert(recurringPayments).values(recurringPaymentsData);

    const costAnalysis = await RecurringPaymentService.getCostAnalysis(testUserId);

    expect(costAnalysis.frequencyBreakdown.monthly.count).toBe(2);
    expect(costAnalysis.frequencyBreakdown.monthly.totalAmount.toString()).toBe('3000');
    expect(costAnalysis.frequencyBreakdown.weekly.count).toBe(1);
    expect(costAnalysis.frequencyBreakdown.weekly.totalAmount.toString()).toBe('500');
  });
});

describe('RecurringPaymentService - Missed Payment Detection', () => {
  let testUserId: string;
  let testAccountId: string;
  let testCategoryId: string;

  beforeAll(async () => {
    const testUser: NewUser = {
      id: 'test_user_missed_payments',
      email: 'test.missed@example.com',
      firstName: 'Missed',
      lastName: 'User',
    };

    await db.insert(users).values(testUser);
    testUserId = testUser.id;

    const testAccount: NewAccount = {
      userId: testUserId,
      name: 'Test Account',
      type: 'checking',
      balance: '10000.00',
    };

    const [account] = await db.insert(accounts).values(testAccount).returning();
    testAccountId = account.id;

    const testCategory: NewCategory = {
      userId: testUserId,
      name: 'Test Category',
      type: 'expense',
      color: '#0000ff',
    };

    const [category] = await db.insert(categories).values(testCategory).returning();
    testCategoryId = category.id;
  });

  afterAll(async () => {
    await db.delete(recurringPayments).where(eq(recurringPayments.userId, testUserId));
    await db.delete(categories).where(eq(categories.userId, testUserId));
    await db.delete(accounts).where(eq(accounts.userId, testUserId));
    await db.delete(users).where(eq(users.id, testUserId));
  });

  beforeEach(async () => {
    await db.delete(recurringPayments).where(eq(recurringPayments.userId, testUserId));
  });

  test('should detect missed payments', async () => {
    // Create overdue recurring payment
    const overdueDate = subDays(new Date(), 10); // 10 days overdue
    
    await db.insert(recurringPayments).values({
      userId: testUserId,
      accountId: testAccountId,
      name: 'Overdue Payment',
      amount: '1500.00',
      frequency: 'monthly',
      nextDueDate: overdueDate,
      categoryId: testCategoryId,
      status: 'pending',
      isActive: true,
    });

    const missedPayments = await RecurringPaymentService.detectMissedPayments(testUserId, 3);

    expect(missedPayments).toHaveLength(1);
    expect(missedPayments[0].paymentName).toBe('Overdue Payment');
    expect(missedPayments[0].daysOverdue).toBe(10);
  });

  test('should not detect payments within grace period', async () => {
    // Create payment that's due yesterday but within grace period
    const recentDueDate = subDays(new Date(), 2); // 2 days ago
    
    await db.insert(recurringPayments).values({
      userId: testUserId,
      accountId: testAccountId,
      name: 'Recent Due Payment',
      amount: '1000.00',
      frequency: 'monthly',
      nextDueDate: recentDueDate,
      categoryId: testCategoryId,
      status: 'pending',
      isActive: true,
    });

    const missedPayments = await RecurringPaymentService.detectMissedPayments(testUserId, 3);

    expect(missedPayments).toHaveLength(0);
  });
});
