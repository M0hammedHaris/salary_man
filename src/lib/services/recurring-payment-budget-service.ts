import { RecurringPaymentService } from '@/lib/services/recurring-payment-service';
import { db } from '@/lib/db';
import Decimal from 'decimal.js';
import { 
  recurringPayments, 
  categories, 
  transactions,
  accounts 
} from '@/lib/db/schema';
import { eq, and, sum, gte, lte } from 'drizzle-orm';
import { 
  startOfMonth, 
  endOfMonth, 
  addMonths, 
  subMonths,
  format 
} from 'date-fns';

export interface BudgetImpactAnalysis {
  totalMonthlyRecurring: number;
  totalQuarterlyRecurring: number;
  totalYearlyRecurring: number;
  categoryBreakdown: Array<{
    categoryId: string;
    categoryName: string;
    monthlyAmount: number;
    quarterlyAmount: number;
    yearlyAmount: number;
    percentage: number;
    paymentCount: number;
  }>;
  budgetAllocation: {
    totalBudget: number;
    recurringAllocation: number;
    availableSpending: number;
    utilizationPercentage: number;
  };
  trends: {
    monthOverMonth: {
      current: number;
      previous: number;
      change: number;
      changePercentage: number;
    };
    quarterOverQuarter: {
      current: number;
      previous: number;
      change: number;
      changePercentage: number;
    };
  };
  projections: {
    nextMonth: number;
    next3Months: number;
    next6Months: number;
    nextYear: number;
  };
  optimizationSuggestions: Array<{
    type: 'duplicate' | 'expensive' | 'unused' | 'upgrade_opportunity';
    paymentId: string;
    paymentName: string;
    suggestion: string;
    potentialSavings: number;
    priority: 'high' | 'medium' | 'low';
  }>;
}

export interface SpendingProjection {
  month: string;
  recurringAmount: number;
  estimatedTotal: number;
  budgetRemaining: number;
  isOverBudget: boolean;
}

export class RecurringPaymentBudgetService {
  /**
   * Get comprehensive budget impact analysis
   */
  static async getBudgetImpactAnalysis(userId: string): Promise<BudgetImpactAnalysis> {
    const [
      recurringPaymentsData,
      budgetData,
      trends,
      projections,
      optimizations
    ] = await Promise.all([
      this.getRecurringPaymentsBreakdown(userId),
      this.getBudgetAllocation(userId),
      this.getTrendAnalysis(userId),
      this.getSpendingProjections(userId),
      this.getOptimizationSuggestions(userId),
    ]);

    const totalMonthlyRecurring = recurringPaymentsData.reduce((sum, item) => sum + item.monthlyAmount, 0);
    const totalQuarterlyRecurring = totalMonthlyRecurring * 3;
    const totalYearlyRecurring = totalMonthlyRecurring * 12;

    return {
      totalMonthlyRecurring,
      totalQuarterlyRecurring,
      totalYearlyRecurring,
      categoryBreakdown: recurringPaymentsData,
      budgetAllocation: budgetData,
      trends,
      projections,
      optimizationSuggestions: optimizations,
    };
  }

  /**
   * Get recurring payments breakdown by category
   */
  private static async getRecurringPaymentsBreakdown(userId: string): Promise<Array<{
    categoryId: string;
    categoryName: string;
    monthlyAmount: number;
    quarterlyAmount: number;
    yearlyAmount: number;
    percentage: number;
    paymentCount: number;
  }>> {
    const results = await db
      .select({
        categoryId: categories.id,
        categoryName: categories.name,
        amount: sum(recurringPayments.amount),
        count: sum(recurringPayments.id), // Count of payments
      })
      .from(recurringPayments)
      .innerJoin(categories, eq(recurringPayments.categoryId, categories.id))
      .where(
        and(
          eq(recurringPayments.userId, userId),
          eq(recurringPayments.isActive, true)
        )
      )
      .groupBy(categories.id, categories.name);

    // Calculate total for percentage calculation using Decimal
    const totalAmount = results.reduce((sum, item) => {
      const monthlyAmount = this.convertToMonthlyAmount(new Decimal(item.amount || '0'), 'monthly');
      return sum.plus(monthlyAmount);
    }, new Decimal(0));

    return results.map((item) => {
      const monthlyAmount = this.convertToMonthlyAmount(new Decimal(item.amount || '0'), 'monthly');
      const quarterlyAmount = monthlyAmount.mul(3);
      const yearlyAmount = monthlyAmount.mul(12);
      const percentage = totalAmount.greaterThan(0) 
        ? monthlyAmount.div(totalAmount).mul(100).toNumber() 
        : 0;

      return {
        categoryId: item.categoryId,
        categoryName: item.categoryName,
        monthlyAmount: monthlyAmount.toNumber(),
        quarterlyAmount: quarterlyAmount.toNumber(),
        yearlyAmount: yearlyAmount.toNumber(),
        percentage,
        paymentCount: parseInt(item.count || '0'),
      };
    });
  }

  /**
   * Get budget allocation information
   */
  private static async getBudgetAllocation(userId: string): Promise<{
    totalBudget: number;
    recurringAllocation: number;
    availableSpending: number;
    utilizationPercentage: number;
  }> {
    // Calculate current month's actual spending
    const currentMonth = new Date();
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);

    // Get total income and expenses for budget calculation
    const [incomeResult] = await db
      .select({
        totalIncome: sum(transactions.amount),
      })
      .from(transactions)
      .innerJoin(accounts, eq(transactions.accountId, accounts.id))
      .where(
        and(
          eq(accounts.userId, userId),
          gte(transactions.transactionDate, monthStart),
          lte(transactions.transactionDate, monthEnd)
          // Filter for positive amounts (income) will be handled in application logic
        )
      );

    const totalIncome = new Decimal(incomeResult?.totalIncome || '0');
    
    // Calculate recurring payments total
    const recurringPaymentsList = await RecurringPaymentService.getRecurringPayments(userId, {
      isActive: true,
      limit: 1000,
    });

    const recurringAllocation = recurringPaymentsList.reduce((sum, payment) => {
      const monthlyAmount = this.convertToMonthlyAmount(new Decimal(payment.amount), payment.frequency);
      return sum.plus(monthlyAmount);
    }, new Decimal(0));

    // Estimate total budget as 80% of income (conservative approach)
    const totalBudget = totalIncome.mul(0.8);
    const availableSpending = Decimal.max(0, totalBudget.minus(recurringAllocation));
    const utilizationPercentage = totalBudget.greaterThan(0) 
      ? recurringAllocation.div(totalBudget).mul(100).toNumber() 
      : 0;

    return {
      totalBudget: totalBudget.toNumber(),
      recurringAllocation: recurringAllocation.toNumber(),
      availableSpending: availableSpending.toNumber(),
      utilizationPercentage,
    };
  }

  /**
   * Get trend analysis (month-over-month, quarter-over-quarter)
   */
  private static async getTrendAnalysis(userId: string): Promise<{
    monthOverMonth: {
      current: number;
      previous: number;
      change: number;
      changePercentage: number;
    };
    quarterOverQuarter: {
      current: number;
      previous: number;
      change: number;
      changePercentage: number;
    };
  }> {
    const currentMonth = new Date();
    const previousMonth = subMonths(currentMonth, 1);
    const currentQuarter = subMonths(currentMonth, 3);

    // Get current month recurring payments
    const currentMonthPayments = await this.getRecurringPaymentsForPeriod(userId, currentMonth);
    const previousMonthPayments = await this.getRecurringPaymentsForPeriod(userId, previousMonth);
    const previousQuarterPayments = await this.getRecurringPaymentsForPeriod(userId, currentQuarter);

    const currentTotal = currentMonthPayments.reduce((sum, p) => 
      sum.plus(new Decimal(p.amount)), new Decimal(0)
    );
    const previousTotal = previousMonthPayments.reduce((sum, p) => 
      sum.plus(new Decimal(p.amount)), new Decimal(0)
    );
    const previousQuarterTotal = previousQuarterPayments.reduce((sum, p) => 
      sum.plus(new Decimal(p.amount)), new Decimal(0)
    );

    const monthChange = currentTotal.minus(previousTotal);
    const monthChangePercentage = previousTotal.greaterThan(0) 
      ? monthChange.div(previousTotal).mul(100).toNumber() 
      : 0;

    const quarterChange = currentTotal.minus(previousQuarterTotal);
    const quarterChangePercentage = previousQuarterTotal.greaterThan(0) 
      ? quarterChange.div(previousQuarterTotal).mul(100).toNumber() 
      : 0;

    return {
      monthOverMonth: {
        current: currentTotal.toNumber(),
        previous: previousTotal.toNumber(),
        change: monthChange.toNumber(),
        changePercentage: monthChangePercentage,
      },
      quarterOverQuarter: {
        current: currentTotal.toNumber(),
        previous: previousQuarterTotal.toNumber(),
        change: quarterChange.toNumber(),
        changePercentage: quarterChangePercentage,
      },
    };
  }

  /**
   * Get spending projections for future periods
   */
  private static async getSpendingProjections(userId: string): Promise<{
    nextMonth: number;
    next3Months: number;
    next6Months: number;
    nextYear: number;
  }> {
    const activePayments = await RecurringPaymentService.getRecurringPayments(userId, {
      isActive: true,
      limit: 1000,
    });

    const monthlyTotal = activePayments.reduce((sum, payment) => {
      const monthlyAmount = this.convertToMonthlyAmount(new Decimal(payment.amount), payment.frequency);
      return sum.plus(monthlyAmount);
    }, new Decimal(0));

    return {
      nextMonth: monthlyTotal.toNumber(),
      next3Months: monthlyTotal.mul(3).toNumber(),
      next6Months: monthlyTotal.mul(6).toNumber(),
      nextYear: monthlyTotal.mul(12).toNumber(),
    };
  }

  /**
   * Get optimization suggestions
   */
  private static async getOptimizationSuggestions(userId: string): Promise<Array<{
    type: 'duplicate' | 'expensive' | 'unused' | 'upgrade_opportunity';
    paymentId: string;
    paymentName: string;
    suggestion: string;
    potentialSavings: number;
    priority: 'high' | 'medium' | 'low';
  }>> {
    const activePayments = await RecurringPaymentService.getRecurringPayments(userId, {
      isActive: true,
      limit: 1000,
    });

    const suggestions: Array<{
      type: 'duplicate' | 'expensive' | 'unused' | 'upgrade_opportunity';
      paymentId: string;
      paymentName: string;
      suggestion: string;
      potentialSavings: number;
      priority: 'high' | 'medium' | 'low';
    }> = [];

    // Detect potential duplicates
    const paymentsByName = new Map<string, typeof activePayments>();
    activePayments.forEach(payment => {
      const normalizedName = payment.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!paymentsByName.has(normalizedName)) {
        paymentsByName.set(normalizedName, []);
      }
      paymentsByName.get(normalizedName)!.push(payment);
    });

    paymentsByName.forEach((payments, _name) => {
      if (payments.length > 1) {
        payments.forEach((payment, index) => {
          if (index > 0) { // Skip the first one
            suggestions.push({
              type: 'duplicate',
              paymentId: payment.id,
              paymentName: payment.name,
              suggestion: `Potential duplicate payment detected. Consider canceling if this is the same service as ${payments[0].name}.`,
              potentialSavings: new Decimal(payment.amount).toNumber(),
              priority: 'medium',
            });
          }
        });
      }
    });

    // Identify expensive subscriptions (top 20% by amount)
    const sortedPayments = [...activePayments].sort((a, b) => {
      const amountA = new Decimal(a.amount);
      const amountB = new Decimal(b.amount);
      return amountB.minus(amountA).toNumber();
    });
    const expensiveThreshold = Math.ceil(sortedPayments.length * 0.2);
    
    sortedPayments.slice(0, expensiveThreshold).forEach(payment => {
      const amount = new Decimal(payment.amount);
      const potentialSavings = amount.mul(0.1); // Assume 10% potential savings
      suggestions.push({
        type: 'expensive',
        paymentId: payment.id,
        paymentName: payment.name,
        suggestion: `This is one of your most expensive recurring payments. Consider reviewing if you're getting value for ₹${payment.amount}.`,
        potentialSavings: potentialSavings.toNumber(),
        priority: 'low',
      });
    });

    return suggestions;
  }

  /**
   * Get detailed spending projections with monthly breakdown
   */
  static async getDetailedSpendingProjections(
    userId: string,
    months: number = 12
  ): Promise<SpendingProjection[]> {
    const budgetData = await this.getBudgetAllocation(userId);
    const activePayments = await RecurringPaymentService.getRecurringPayments(userId, {
      isActive: true,
      limit: 1000,
    });

    const monthlyRecurringTotal = activePayments.reduce((sum, payment) => {
      const monthlyAmount = this.convertToMonthlyAmount(new Decimal(payment.amount), payment.frequency);
      return sum.plus(monthlyAmount);
    }, new Decimal(0));

    const projections: SpendingProjection[] = [];
    
    for (let i = 0; i < months; i++) {
      const projectionDate = addMonths(new Date(), i);
      const month = format(projectionDate, 'MMM yyyy');
      
      // Estimate total spending as recurring + 50% for variable expenses
      const estimatedTotal = monthlyRecurringTotal.mul(1.5);
      const budgetRemaining = new Decimal(budgetData.totalBudget).minus(estimatedTotal);
      
      projections.push({
        month,
        recurringAmount: monthlyRecurringTotal.toNumber(),
        estimatedTotal: estimatedTotal.toNumber(),
        budgetRemaining: budgetRemaining.toNumber(),
        isOverBudget: budgetRemaining.lessThan(0),
      });
    }

    return projections;
  }

  /**
   * Helper method to convert payment amount to monthly equivalent
   */
  private static convertToMonthlyAmount(amount: Decimal, frequency: string): Decimal {
    switch (frequency) {
      case 'weekly':
        return amount.mul(4.33); // Average weeks per month
      case 'monthly':
        return amount;
      case 'quarterly':
        return amount.div(3);
      case 'yearly':
        return amount.div(12);
      default:
        return amount;
    }
  }

  /**
   * Helper method to get recurring payments for a specific period
   */
  private static async getRecurringPaymentsForPeriod(userId: string, date: Date) {
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);

    return await db
      .select()
      .from(recurringPayments)
      .where(
        and(
          eq(recurringPayments.userId, userId),
          eq(recurringPayments.isActive, true),
          gte(recurringPayments.createdAt, monthStart),
          lte(recurringPayments.createdAt, monthEnd)
        )
      );
  }
}
