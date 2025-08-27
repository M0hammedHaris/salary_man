import { z } from 'zod';
import Decimal from 'decimal.js';
import { eq, and, gte, desc, lte, lt } from 'drizzle-orm';
import { differenceInDays, startOfDay, subDays, addWeeks, addMonths, addYears } from 'date-fns';
import { db } from '../db';
import { 
  recurringPayments, 
  transactions,
  accounts,
  categories,
  type RecurringPayment, 
  type NewRecurringPayment,
  type Transaction,
  type Account,
  type Category,
  type PaymentFrequency,
  type BillStatus
} from '../db/schema';
import { BillService } from './bill-service';

// Validation schemas
export const recurringPaymentCreateSchema = z.object({
  userId: z.string(),
  accountId: z.string(),
  name: z.string().min(1, 'Payment name is required'),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid amount format'),
  frequency: z.enum(['weekly', 'monthly', 'quarterly', 'yearly']),
  nextDueDate: z.string().datetime(),
  categoryId: z.string(),
  reminderDays: z.string().default('1,3,7'),
});

export const patternDetectionConfigSchema = z.object({
  minOccurrences: z.number().min(2).default(3),
  amountTolerancePercent: z.number().min(0).max(50).default(5),
  dateVarianceDays: z.number().min(0).max(7).default(3),
  lookbackMonths: z.number().min(1).max(24).default(12),
  confidenceThreshold: z.number().min(0.1).max(1.0).default(0.7),
});

export const costAnalysisSchema = z.object({
  userId: z.string(),
  period: z.enum(['monthly', 'quarterly', 'yearly']).default('monthly'),
  includeProjections: z.boolean().default(true),
});

// Types
export interface PatternDetectionConfig {
  minOccurrences: number;
  amountTolerancePercent: number;
  dateVarianceDays: number;
  lookbackMonths: number;
  confidenceThreshold: number;
}

export interface TransactionPattern {
  id: string;
  accountId: string;
  merchantPattern: string;
  amounts: Decimal[];
  dates: Date[];
  frequency: PaymentFrequency;
  confidence: number;
  averageAmount: Decimal;
  lastOccurrence: Date;
  nextExpectedDate: Date;
  categoryId?: string;
}

export interface RecurringPaymentDetection {
  pattern: TransactionPattern;
  suggestedName: string;
  suggestedCategory: string;
  existingPaymentId?: string;
  isNewPattern: boolean;
  riskScore: number;
}

export interface CostAnalysis {
  totalRecurringCosts: {
    monthly: Decimal;
    quarterly: Decimal;
    yearly: Decimal;
  };
  categoryBreakdown: Array<{
    categoryId: string;
    categoryName: string;
    monthlyAmount: Decimal;
    quarterlyAmount: Decimal;
    yearlyAmount: Decimal;
    percentage: number;
  }>;
  frequencyBreakdown: {
    weekly: { count: number; totalAmount: Decimal };
    monthly: { count: number; totalAmount: Decimal };
    quarterly: { count: number; totalAmount: Decimal };
    yearly: { count: number; totalAmount: Decimal };
  };
  trends: {
    growthRate: number;
    newPaymentsThisMonth: number;
    cancelledPaymentsThisMonth: number;
  };
  budgetImpact: {
    totalBudgetAllocation: Decimal;
    availableSpending: Decimal;
    projectedShortfall?: Decimal;
  };
}

export interface MissedPaymentAlert {
  recurringPaymentId: string;
  paymentName: string;
  expectedAmount: Decimal;
  expectedDate: Date;
  daysOverdue: number;
  accountId: string;
  accountName: string;
  lastPaymentDate?: Date;
  missedConsecutivePayments: number;
}

/**
 * Recurring Payment Service for pattern detection, automation, and management
 */
export class RecurringPaymentService {

  /**
   * Default configuration for pattern detection
   */
  static readonly DEFAULT_CONFIG: PatternDetectionConfig = {
    minOccurrences: 3,
    amountTolerancePercent: 5,
    dateVarianceDays: 3,
    lookbackMonths: 12,
    confidenceThreshold: 0.7,
  };

  /**
   * Analyze transaction history to detect recurring payment patterns
   */
  static async detectRecurringPatterns(
    userId: string,
    config: Partial<PatternDetectionConfig> = {}
  ): Promise<RecurringPaymentDetection[]> {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
    const lookbackDate = subDays(new Date(), finalConfig.lookbackMonths * 30);

    // Get all expense transactions for analysis
    const userTransactions = await db
      .select({
        transaction: transactions,
        account: accounts,
        category: categories,
      })
      .from(transactions)
      .innerJoin(accounts, eq(transactions.accountId, accounts.id))
      .innerJoin(categories, eq(transactions.categoryId, categories.id))
      .where(
        and(
          eq(transactions.userId, userId),
          gte(transactions.transactionDate, lookbackDate),
          lt(transactions.amount, '0'), // Only expense transactions
          eq(categories.type, 'expense')
        )
      )
      .orderBy(desc(transactions.transactionDate));

    // Group transactions by potential patterns
    const potentialPatterns = this.groupTransactionsByPattern(userTransactions, finalConfig);
    
    // Analyze each pattern for frequency and regularity
    const detectedPatterns: TransactionPattern[] = [];
    
    for (const pattern of potentialPatterns) {
      const analysisResult = this.analyzePatternFrequency(pattern, finalConfig);
      if (analysisResult.confidence >= finalConfig.confidenceThreshold) {
        detectedPatterns.push(analysisResult);
      }
    }

    // Get existing recurring payments to avoid duplicates
    const existingPayments = await db
      .select()
      .from(recurringPayments)
      .where(
        and(
          eq(recurringPayments.userId, userId),
          eq(recurringPayments.isActive, true)
        )
      );

    // Create detection results with suggestions
    const detections: RecurringPaymentDetection[] = [];
    
    for (const pattern of detectedPatterns) {
      // Check if this pattern matches an existing payment
      const existingPayment = this.findMatchingExistingPayment(pattern, existingPayments);
      
      const detection: RecurringPaymentDetection = {
        pattern,
        suggestedName: this.generatePaymentName(pattern),
        suggestedCategory: pattern.categoryId || '',
        existingPaymentId: existingPayment?.id,
        isNewPattern: !existingPayment,
        riskScore: this.calculateRiskScore(pattern),
      };
      
      detections.push(detection);
    }

    return detections.sort((a, b) => b.pattern.confidence - a.pattern.confidence);
  }

  /**
   * Group transactions by potential recurring payment patterns
   */
  static groupTransactionsByPattern(
    transactionData: Array<{
      transaction: Transaction;
      account: Account;
      category: Category;
    }>,
    config: PatternDetectionConfig
  ): Array<{
    accountId: string;
    merchantPattern: string;
    transactions: Array<{ transaction: Transaction; account: Account; category: Category }>;
  }> {
    const patterns = new Map<string, Array<{ transaction: Transaction; account: Account; category: Category }>>();

    for (const data of transactionData) {
      const { transaction } = data;
      
      // Create merchant pattern from transaction description
      const merchantPattern = this.extractMerchantPattern(transaction.description);
      
      // Create pattern key (account + merchant pattern)
      const patternKey = `${transaction.accountId}:${merchantPattern}`;
      
      if (!patterns.has(patternKey)) {
        patterns.set(patternKey, []);
      }
      
      patterns.get(patternKey)!.push(data);
    }

    // Filter patterns that have minimum occurrences
    const validPatterns: Array<{
      accountId: string;
      merchantPattern: string;
      transactions: Array<{ transaction: Transaction; account: Account; category: Category }>;
    }> = [];

    for (const [patternKey, transactionGroup] of patterns.entries()) {
      if (transactionGroup.length >= config.minOccurrences) {
        const [accountId, merchantPattern] = patternKey.split(':');
        validPatterns.push({
          accountId,
          merchantPattern,
          transactions: transactionGroup,
        });
      }
    }

    return validPatterns;
  }

  /**
   * Extract merchant pattern from transaction description
   */
  static extractMerchantPattern(description: string): string {
    // Remove common payment processing indicators
    const cleaned = description
      .toLowerCase()
      .replace(/\b(payment|autopay|auto|recurring|subscription|bill)\b/g, '')
      .replace(/\b\d{4}[*x]\d+\b/g, '') // Remove partial card numbers
      .replace(/\b\d{2}\/\d{2}\b/g, '') // Remove dates
      .replace(/[#*]+/g, '') // Remove special characters
      .trim();

    // Extract the core merchant name (first significant word or phrase)
    const words = cleaned.split(/\s+/).filter(word => word.length > 2);
    
    if (words.length === 0) {
      return cleaned.substring(0, 20); // Fallback to first 20 characters
    }

    // Take first 1-3 significant words
    return words.slice(0, Math.min(3, words.length)).join(' ');
  }

  /**
   * Analyze pattern frequency and calculate confidence score
   */
  static analyzePatternFrequency(
    patternGroup: {
      accountId: string;
      merchantPattern: string;
      transactions: Array<{ transaction: Transaction; account: Account; category: Category }>;
    },
    config: PatternDetectionConfig
  ): TransactionPattern {
    const { transactions: transactionData } = patternGroup;
    const transactions = transactionData.map(data => data.transaction).sort((a, b) => 
      new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime()
    );

    const amounts = transactions.map(t => new Decimal(t.amount).abs());
    const dates = transactions.map(t => new Date(t.transactionDate));
    
    // Calculate average amount and amount consistency
    const averageAmount = amounts.reduce((sum, amount) => sum.plus(amount), new Decimal(0)).div(amounts.length);
    const amountConsistency = this.calculateAmountConsistency(amounts, averageAmount, config.amountTolerancePercent);
    
    // Analyze date patterns to determine frequency
    const frequencyAnalysis = this.analyzeFrequencyPattern(dates, config.dateVarianceDays);
    
    // Calculate overall confidence score
    const confidence = this.calculatePatternConfidence({
      amountConsistency,
      dateRegularity: frequencyAnalysis.regularity,
      occurrences: transactions.length,
      timeSpan: differenceInDays(dates[dates.length - 1], dates[0]),
      minOccurrences: config.minOccurrences,
    });

    // Predict next expected date
    const nextExpectedDate = this.predictNextPaymentDate(
      dates[dates.length - 1],
      frequencyAnalysis.detectedFrequency
    );

    // Get most common category
    const categoryId = this.getMostCommonCategory(transactionData);

    return {
      id: `pattern_${patternGroup.accountId}_${Date.now()}`,
      accountId: patternGroup.accountId,
      merchantPattern: patternGroup.merchantPattern,
      amounts,
      dates,
      frequency: frequencyAnalysis.detectedFrequency,
      confidence,
      averageAmount,
      lastOccurrence: dates[dates.length - 1],
      nextExpectedDate,
      categoryId,
    };
  }

  /**
   * Calculate amount consistency score (0-1)
   */
  static calculateAmountConsistency(
    amounts: Decimal[],
    average: Decimal,
    tolerancePercent: number
  ): number {
    if (amounts.length === 0) return 0;

    const tolerance = average.mul(tolerancePercent / 100);
    let consistentCount = 0;

    for (const amount of amounts) {
      const difference = amount.minus(average).abs();
      if (difference.lte(tolerance)) {
        consistentCount++;
      }
    }

    return consistentCount / amounts.length;
  }

  /**
   * Analyze frequency pattern from dates
   */
  static analyzeFrequencyPattern(
    dates: Date[],
    dateVarianceDays: number
  ): { detectedFrequency: PaymentFrequency; regularity: number } {
    if (dates.length < 2) {
      return { detectedFrequency: 'monthly', regularity: 0 };
    }

    // Calculate intervals between consecutive dates
    const intervals: number[] = [];
    for (let i = 1; i < dates.length; i++) {
      intervals.push(differenceInDays(dates[i], dates[i - 1]));
    }

    // Test different frequencies
    const frequencyTests = {
      weekly: { expectedInterval: 7, tolerance: dateVarianceDays },
      monthly: { expectedInterval: 30, tolerance: dateVarianceDays * 2 }, // More tolerance for monthly
      quarterly: { expectedInterval: 91, tolerance: dateVarianceDays * 3 },
      yearly: { expectedInterval: 365, tolerance: dateVarianceDays * 7 },
    };

    let bestMatch: { frequency: PaymentFrequency; score: number } = {
      frequency: 'monthly',
      score: 0,
    };

    for (const [frequency, test] of Object.entries(frequencyTests) as Array<[PaymentFrequency, typeof frequencyTests.weekly]>) {
      let matchingIntervals = 0;
      
      for (const interval of intervals) {
        const difference = Math.abs(interval - test.expectedInterval);
        if (difference <= test.tolerance) {
          matchingIntervals++;
        }
      }
      
      const score = matchingIntervals / intervals.length;
      if (score > bestMatch.score) {
        bestMatch = { frequency, score };
      }
    }

    return {
      detectedFrequency: bestMatch.frequency,
      regularity: bestMatch.score,
    };
  }

  /**
   * Calculate pattern confidence score (0-1)
   */
  static calculatePatternConfidence(params: {
    amountConsistency: number;
    dateRegularity: number;
    occurrences: number;
    timeSpan: number;
    minOccurrences: number;
  }): number {
    const {
      amountConsistency,
      dateRegularity,
      occurrences,
      timeSpan,
      minOccurrences,
    } = params;

    // Base confidence from amount and date consistency
    const baseConfidence = (amountConsistency + dateRegularity) / 2;
    
    // Boost confidence for more occurrences
    const occurrenceBoost = Math.min(occurrences / (minOccurrences * 2), 1);
    
    // Boost confidence for longer time spans (more historical data)
    const timeSpanBoost = Math.min(timeSpan / 365, 1); // Up to 1 year
    
    // Weighted average
    return (baseConfidence * 0.6) + (occurrenceBoost * 0.25) + (timeSpanBoost * 0.15);
  }

  /**
   * Predict next payment date based on frequency
   */
  static predictNextPaymentDate(lastDate: Date, frequency: PaymentFrequency): Date {
    switch (frequency) {
      case 'weekly':
        return addWeeks(lastDate, 1);
      case 'monthly':
        return addMonths(lastDate, 1);
      case 'quarterly':
        return addMonths(lastDate, 3);
      case 'yearly':
        return addYears(lastDate, 1);
      default:
        return addMonths(lastDate, 1);
    }
  }

  /**
   * Get most common category from transactions
   */
  static getMostCommonCategory(
    transactionData: Array<{ transaction: Transaction; account: Account; category: Category }>
  ): string {
    const categoryCounts = new Map<string, number>();
    
    for (const data of transactionData) {
      const categoryId = data.transaction.categoryId;
      categoryCounts.set(categoryId, (categoryCounts.get(categoryId) || 0) + 1);
    }

    let mostCommonCategory = '';
    let maxCount = 0;
    
    for (const [categoryId, count] of categoryCounts.entries()) {
      if (count > maxCount) {
        maxCount = count;
        mostCommonCategory = categoryId;
      }
    }

    return mostCommonCategory;
  }

  /**
   * Find matching existing recurring payment
   */
  static findMatchingExistingPayment(
    pattern: TransactionPattern,
    existingPayments: RecurringPayment[]
  ): RecurringPayment | undefined {
    for (const payment of existingPayments) {
      // Check if account and amount are similar
      if (payment.accountId === pattern.accountId) {
        const paymentAmount = new Decimal(payment.amount);
        const difference = pattern.averageAmount.minus(paymentAmount).abs();
        const tolerance = paymentAmount.mul(0.1); // 10% tolerance
        
        if (difference.lte(tolerance)) {
          return payment;
        }
      }
    }
    return undefined;
  }

  /**
   * Generate suggested payment name from pattern
   */
  static generatePaymentName(pattern: TransactionPattern): string {
    const merchantName = pattern.merchantPattern
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    const frequencyText = pattern.frequency.charAt(0).toUpperCase() + pattern.frequency.slice(1);
    
    return `${merchantName} (${frequencyText})`;
  }

  /**
   * Calculate risk score for a pattern (0-1, higher = riskier)
   */
  static calculateRiskScore(pattern: TransactionPattern): number {
    let riskScore = 0;

    // Low confidence = higher risk
    riskScore += (1 - pattern.confidence) * 0.4;
    
    // Large amounts = higher risk
    if (pattern.averageAmount.gte(10000)) { // Above 10K INR
      riskScore += 0.3;
    } else if (pattern.averageAmount.gte(5000)) { // Above 5K INR
      riskScore += 0.15;
    }
    
    // Few occurrences = higher risk
    if (pattern.amounts.length < 5) {
      riskScore += 0.2;
    }
    
    // Recent pattern = higher risk (could be temporary)
    const daysSinceFirst = differenceInDays(new Date(), pattern.dates[0]);
    if (daysSinceFirst < 90) { // Less than 3 months
      riskScore += 0.1;
    }

    return Math.min(riskScore, 1);
  }

  /**
   * Create recurring payment from detected pattern
   */
  static async createRecurringPaymentFromPattern(
    userId: string,
    pattern: TransactionPattern,
    overrides: Partial<NewRecurringPayment> = {}
  ): Promise<RecurringPayment> {
    const paymentData: NewRecurringPayment = {
      userId,
      accountId: pattern.accountId,
      name: overrides.name || this.generatePaymentName(pattern),
      amount: overrides.amount || pattern.averageAmount.toString(),
      frequency: overrides.frequency || pattern.frequency,
      nextDueDate: overrides.nextDueDate || pattern.nextExpectedDate,
      categoryId: overrides.categoryId || pattern.categoryId || '',
      reminderDays: overrides.reminderDays || '1,3,7',
      ...overrides,
    };

    const created = await db
      .insert(recurringPayments)
      .values(paymentData)
      .returning();

    return created[0];
  }

  /**
   * Get comprehensive cost analysis for user's recurring payments
   */
  static async getCostAnalysis(
    userId: string,
    _options: { period?: 'monthly' | 'quarterly' | 'yearly'; includeProjections?: boolean } = {}
  ): Promise<CostAnalysis> {

    // Get all active recurring payments
    const userPayments = await db
      .select({
        payment: recurringPayments,
        category: categories,
      })
      .from(recurringPayments)
      .innerJoin(categories, eq(recurringPayments.categoryId, categories.id))
      .where(
        and(
          eq(recurringPayments.userId, userId),
          eq(recurringPayments.isActive, true)
        )
      );

    // Calculate normalized monthly amounts for each payment
    const monthlyAmounts = userPayments.map(({ payment }) => {
      const amount = new Decimal(payment.amount);
      switch (payment.frequency) {
        case 'weekly':
          return amount.mul(52).div(12); // Weekly to monthly
        case 'monthly':
          return amount;
        case 'quarterly':
          return amount.div(3); // Quarterly to monthly
        case 'yearly':
          return amount.div(12); // Yearly to monthly
        default:
          return amount;
      }
    });

    const totalMonthlyAmount = monthlyAmounts.reduce(
      (sum, amount) => sum.plus(amount),
      new Decimal(0)
    );

    // Calculate totals for different periods
    const totalRecurringCosts = {
      monthly: totalMonthlyAmount,
      quarterly: totalMonthlyAmount.mul(3),
      yearly: totalMonthlyAmount.mul(12),
    };

    // Category breakdown
    const categoryMap = new Map<string, { amount: Decimal; name: string }>();
    
    userPayments.forEach(({ payment: _payment, category }, index) => {
      const categoryId = category.id;
      const monthlyAmount = monthlyAmounts[index];
      
      if (categoryMap.has(categoryId)) {
        categoryMap.get(categoryId)!.amount = categoryMap.get(categoryId)!.amount.plus(monthlyAmount);
      } else {
        categoryMap.set(categoryId, { amount: monthlyAmount, name: category.name });
      }
    });

    const categoryBreakdown = Array.from(categoryMap.entries()).map(([categoryId, data]) => ({
      categoryId,
      categoryName: data.name,
      monthlyAmount: data.amount,
      quarterlyAmount: data.amount.mul(3),
      yearlyAmount: data.amount.mul(12),
      percentage: totalMonthlyAmount.isZero() ? 0 : data.amount.div(totalMonthlyAmount).mul(100).toNumber(),
    }));

    // Frequency breakdown
    const frequencyBreakdown = {
      weekly: { count: 0, totalAmount: new Decimal(0) },
      monthly: { count: 0, totalAmount: new Decimal(0) },
      quarterly: { count: 0, totalAmount: new Decimal(0) },
      yearly: { count: 0, totalAmount: new Decimal(0) },
    };

    userPayments.forEach(({ payment }) => {
      const frequency = payment.frequency;
      const amount = new Decimal(payment.amount);
      
      frequencyBreakdown[frequency].count++;
      frequencyBreakdown[frequency].totalAmount = frequencyBreakdown[frequency].totalAmount.plus(amount);
    });

    // Calculate trends (simplified for now)
    const currentDate = new Date();
    const lastMonth = subDays(currentDate, 30);
    
    const recentPayments = await db
      .select()
      .from(recurringPayments)
      .where(
        and(
          eq(recurringPayments.userId, userId),
          gte(recurringPayments.createdAt, lastMonth)
        )
      );

    const cancelledPayments = await db
      .select()
      .from(recurringPayments)
      .where(
        and(
          eq(recurringPayments.userId, userId),
          eq(recurringPayments.isActive, false),
          gte(recurringPayments.updatedAt, lastMonth)
        )
      );

    const trends = {
      growthRate: 0, // Would need historical data for proper calculation
      newPaymentsThisMonth: recentPayments.length,
      cancelledPaymentsThisMonth: cancelledPayments.length,
    };

    // Budget impact (simplified - would need budget data)
    const budgetImpact = {
      totalBudgetAllocation: totalRecurringCosts.monthly,
      availableSpending: new Decimal(0), // Would calculate from budget
      projectedShortfall: undefined,
    };

    return {
      totalRecurringCosts,
      categoryBreakdown,
      frequencyBreakdown,
      trends,
      budgetImpact,
    };
  }

  /**
   * Detect missed recurring payments
   */
  static async detectMissedPayments(
    userId: string,
    gracePeriodDays: number = 3
  ): Promise<MissedPaymentAlert[]> {
    const currentDate = startOfDay(new Date());
    const gracePeriodDate = subDays(currentDate, gracePeriodDays);

    // Get recurring payments that should have been processed by now
    const overduePendingPayments = await db
      .select({
        payment: recurringPayments,
        account: accounts,
      })
      .from(recurringPayments)
      .innerJoin(accounts, eq(recurringPayments.accountId, accounts.id))
      .where(
        and(
          eq(recurringPayments.userId, userId),
          eq(recurringPayments.isActive, true),
          eq(recurringPayments.status, 'pending'),
          lte(recurringPayments.nextDueDate, gracePeriodDate)
        )
      );

    const missedAlerts: MissedPaymentAlert[] = [];

    for (const { payment, account } of overduePendingPayments) {
      const expectedDate = new Date(payment.nextDueDate);
      const daysOverdue = differenceInDays(currentDate, expectedDate);

      // Count consecutive missed payments (simplified)
      const missedConsecutivePayments = 1; // At least this one is missed

      const missedAlert: MissedPaymentAlert = {
        recurringPaymentId: payment.id,
        paymentName: payment.name,
        expectedAmount: new Decimal(payment.amount),
        expectedDate,
        daysOverdue,
        accountId: account.id,
        accountName: account.name,
        lastPaymentDate: payment.lastProcessed || undefined,
        missedConsecutivePayments,
      };

      missedAlerts.push(missedAlert);
    }

    return missedAlerts;
  }

  /**
   * Process automated transaction creation for confirmed recurring payments
   */
  static async processAutomatedPayments(userId: string): Promise<{
    createdTransactions: Transaction[];
    updatedPayments: RecurringPayment[];
    errors: Array<{ paymentId: string; error: string }>;
  }> {
    const today = startOfDay(new Date());
    
    // Get payments that are due today and marked for automation
    const duePayments = await db
      .select()
      .from(recurringPayments)
      .where(
        and(
          eq(recurringPayments.userId, userId),
          eq(recurringPayments.isActive, true),
          eq(recurringPayments.status, 'pending'),
          lte(recurringPayments.nextDueDate, today)
        )
      );

    const results = {
      createdTransactions: [] as Transaction[],
      updatedPayments: [] as RecurringPayment[],
      errors: [] as Array<{ paymentId: string; error: string }>,
    };

    for (const payment of duePayments) {
      try {
        // Create transaction for the payment
        const transaction = await db
          .insert(transactions)
          .values({
            userId,
            accountId: payment.accountId,
            amount: `-${payment.amount}`, // Negative for expense
            description: `Recurring: ${payment.name}`,
            categoryId: payment.categoryId,
            transactionDate: today,
            isRecurring: true,
            recurringPaymentId: payment.id,
          })
          .returning();

        results.createdTransactions.push(transaction[0]);

        // Update payment status and next due date
        const nextDueDate = BillService.calculateNextDueDate(
          new Date(payment.nextDueDate),
          payment.frequency
        );

        const updatedPayment = await db
          .update(recurringPayments)
          .set({
            status: 'paid',
            paymentDate: today,
            lastProcessed: today,
            nextDueDate,
            updatedAt: new Date(),
          })
          .where(eq(recurringPayments.id, payment.id))
          .returning();

        results.updatedPayments.push(updatedPayment[0]);

      } catch (error) {
        results.errors.push({
          paymentId: payment.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  /**
   * Get recurring payments with optional filtering
   */
  static async getRecurringPayments(
    userId: string,
    options: {
      status?: BillStatus;
      accountId?: string;
      frequency?: PaymentFrequency;
      isActive?: boolean;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<Array<RecurringPayment & { account: Account; category: Category }>> {
    const {
      status,
      accountId,
      frequency,
      isActive = true,
      limit = 50,
      offset = 0,
    } = options;

    const whereConditions = [eq(recurringPayments.userId, userId)];
    
    if (status) whereConditions.push(eq(recurringPayments.status, status));
    if (accountId) whereConditions.push(eq(recurringPayments.accountId, accountId));
    if (frequency) whereConditions.push(eq(recurringPayments.frequency, frequency));
    if (isActive !== undefined) whereConditions.push(eq(recurringPayments.isActive, isActive));

    const results = await db
      .select({
        payment: recurringPayments,
        account: accounts,
        category: categories,
      })
      .from(recurringPayments)
      .innerJoin(accounts, eq(recurringPayments.accountId, accounts.id))
      .innerJoin(categories, eq(recurringPayments.categoryId, categories.id))
      .where(and(...whereConditions))
      .orderBy(desc(recurringPayments.nextDueDate))
      .limit(limit)
      .offset(offset);

    return results.map(({ payment, account, category }) => ({
      ...payment,
      account,
      category,
    }));
  }

  /**
   * Update recurring payment details
   */
  static async updateRecurringPayment(
    paymentId: string,
    userId: string,
    updates: Partial<Pick<RecurringPayment, 'name' | 'amount' | 'frequency' | 'nextDueDate' | 'categoryId' | 'reminderDays' | 'isActive'>>
  ): Promise<RecurringPayment | null> {
    // Recalculate next due date if frequency changed
    const finalUpdates = { ...updates };
    
    if (updates.frequency && updates.nextDueDate) {
      // If both frequency and next due date are provided, use them as-is
    } else if (updates.frequency) {
      // If only frequency changed, recalculate next due date
      const currentPayment = await db
        .select()
        .from(recurringPayments)
        .where(
          and(
            eq(recurringPayments.id, paymentId),
            eq(recurringPayments.userId, userId)
          )
        )
        .limit(1);

      if (currentPayment.length > 0) {
        const newNextDueDate = BillService.calculateNextDueDate(
          new Date(currentPayment[0].nextDueDate),
          updates.frequency
        );
        finalUpdates.nextDueDate = newNextDueDate;
      }
    }

    const updated = await db
      .update(recurringPayments)
      .set({
        ...finalUpdates,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(recurringPayments.id, paymentId),
          eq(recurringPayments.userId, userId)
        )
      )
      .returning();

    return updated.length > 0 ? updated[0] : null;
  }

  /**
   * Cancel recurring payment (mark as inactive)
   */
  static async cancelRecurringPayment(
    paymentId: string,
    userId: string
  ): Promise<RecurringPayment | null> {
    return this.updateRecurringPayment(paymentId, userId, {
      isActive: false,
    });
  }

  /**
   * Get missed recurring payments (overdue payments)
   */
  static async getMissedPayments(userId: string): Promise<Array<RecurringPayment & { account: Account; category: Category }>> {
    const today = new Date();
    
    const results = await db
      .select({
        payment: recurringPayments,
        account: accounts,
        category: categories,
      })
      .from(recurringPayments)
      .innerJoin(accounts, eq(recurringPayments.accountId, accounts.id))
      .innerJoin(categories, eq(recurringPayments.categoryId, categories.id))
      .where(
        and(
          eq(recurringPayments.userId, userId),
          eq(recurringPayments.isActive, true),
          lt(recurringPayments.nextDueDate, today),
          eq(recurringPayments.status, 'pending')
        )
      )
      .orderBy(desc(recurringPayments.nextDueDate));

    return results.map(({ payment, account, category }) => ({
      ...payment,
      account,
      category,
    }));
  }
}
