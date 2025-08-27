import { eq, and, sql, desc, asc, gte, lte, inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import { transactions, accounts, categories } from '@/lib/db/schema';
import type { AccountType } from '@/lib/db/schema';
import type {
  AnalyticsOverview,
  CashFlowData,
  SpendingCategory,
  AccountTrend,
  CreditUtilization,
  NetWorthData,
  PeriodComparison,
  AnalyticsFilters,
  AnalyticsDashboardData,
  DateRange,
} from '@/lib/types/analytics';
import {
  generateDateIntervals,
  getOptimalGrouping,
  formatDateForGrouping,
  calculatePercentageChange,
  getTrend,
  calculateRunningBalance,
} from '@/lib/utils/analytics-utils';

export class AnalyticsService {
  /**
   * Get analytics overview for the specified period
   */
  static async getOverview(userId: string, filters: AnalyticsFilters): Promise<AnalyticsOverview> {
    try {
      const { dateRange, accountIds, categoryIds, accountTypes } = filters;
      
      // Build transaction filters
      const transactionConditions = [
        eq(transactions.userId, userId),
        gte(transactions.transactionDate, dateRange.startDate),
        lte(transactions.transactionDate, dateRange.endDate),
      ];

      if (accountIds && accountIds.length > 0) {
        transactionConditions.push(inArray(transactions.accountId, accountIds));
      }

      if (categoryIds && categoryIds.length > 0) {
        transactionConditions.push(inArray(transactions.categoryId, categoryIds));
      }

      // Get transaction summary with category type information
      const transactionSummary = await db
        .select({
          totalAmount: sql<string>`SUM(${transactions.amount})`,
          count: sql<number>`COUNT(*)`,
          avgAmount: sql<string>`AVG(${transactions.amount})`,
          categoryType: categories.type,
        })
        .from(transactions)
        .innerJoin(categories, eq(transactions.categoryId, categories.id))
        .where(and(...transactionConditions))
        .groupBy(categories.type);

      // Calculate income and expenses
      let totalIncome = 0;
      let totalExpenses = 0;
      let transactionCount = 0;
      let totalTransactionValue = 0;

      transactionSummary.forEach(summary => {
        const amount = parseFloat(summary.totalAmount || '0');
        transactionCount += summary.count;
        totalTransactionValue += Math.abs(amount);

        if (summary.categoryType === 'income') {
          totalIncome += amount;
        } else if (summary.categoryType === 'expense') {
          totalExpenses += Math.abs(amount); // Expenses are stored as positive values
        }
      });

      const netCashFlow = totalIncome - totalExpenses;
      const averageTransactionValue = transactionCount > 0 ? totalTransactionValue / transactionCount : 0;

      // Get account balances for assets and liabilities calculation
      const accountConditions = [eq(accounts.userId, userId), eq(accounts.isActive, true)];
      
      if (accountIds && accountIds.length > 0) {
        accountConditions.push(inArray(accounts.id, accountIds));
      }

      if (accountTypes && accountTypes.length > 0) {
        // Filter by account types with proper type casting
        const validAccountTypes = accountTypes.filter(type => 
          ['checking', 'savings', 'investment', 'credit_card', 'other'].includes(type)
        ) as Array<'checking' | 'savings' | 'investment' | 'credit_card' | 'other'>;
        if (validAccountTypes.length > 0) {
          accountConditions.push(inArray(accounts.type, validAccountTypes));
        }
      }

      const accountBalances = await db
        .select({
          balance: accounts.balance,
          type: accounts.type,
        })
        .from(accounts)
        .where(and(...accountConditions));

      let totalAssets = 0;
      let totalLiabilities = 0;
      const accountCount = accountBalances.length;

      accountBalances.forEach(account => {
        const balance = parseFloat(account.balance);
        
        if (account.type === 'credit_card') {
          // Credit card balances are liabilities
          totalLiabilities += Math.abs(balance);
        } else {
          // Other account types are assets
          totalAssets += balance;
        }
      });

      const netWorth = totalAssets - totalLiabilities;

      return {
        totalIncome,
        totalExpenses,
        netCashFlow,
        totalAssets,
        totalLiabilities,
        netWorth,
        transactionCount,
        accountCount,
        averageTransactionValue,
        period: dateRange,
      };
    } catch (error) {
      console.error('Error getting analytics overview:', error);
      throw new Error('Failed to get analytics overview');
    }
  }

  /**
   * Get cash flow data (income vs expenses over time)
   */
  static async getCashFlow(
    userId: string, 
    dateRange: DateRange, 
    groupBy?: 'day' | 'week' | 'month',
    accountIds?: string[]
  ): Promise<CashFlowData[]> {
    try {
      const grouping = groupBy || getOptimalGrouping(dateRange);
      const intervals = generateDateIntervals(dateRange, grouping);

      const transactionConditions = [
        eq(transactions.userId, userId),
        gte(transactions.transactionDate, dateRange.startDate),
        lte(transactions.transactionDate, dateRange.endDate),
      ];

      if (accountIds && accountIds.length > 0) {
        transactionConditions.push(inArray(transactions.accountId, accountIds));
      }

      // Get all transactions with category type information
      const transactionData = await db
        .select({
          amount: transactions.amount,
          date: transactions.transactionDate,
          categoryType: categories.type,
        })
        .from(transactions)
        .innerJoin(categories, eq(transactions.categoryId, categories.id))
        .where(and(...transactionConditions))
        .orderBy(asc(transactions.transactionDate));

      // Group transactions by date intervals
      return intervals.map(intervalDate => {
        let startDate: Date;
        let endDate: Date;

        switch (grouping) {
          case 'day':
            startDate = new Date(intervalDate);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(intervalDate);
            endDate.setHours(23, 59, 59, 999);
            break;
          case 'week':
            startDate = new Date(intervalDate);
            endDate = new Date(intervalDate.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
            break;
          case 'month':
            startDate = new Date(intervalDate.getFullYear(), intervalDate.getMonth(), 1);
            endDate = new Date(intervalDate.getFullYear(), intervalDate.getMonth() + 1, 0, 23, 59, 59, 999);
            break;
          default:
            startDate = new Date(intervalDate);
            endDate = new Date(intervalDate.getTime() + 24 * 60 * 60 * 1000 - 1);
        }

        const periodTransactions = transactionData.filter(t => 
          t.date >= startDate && t.date <= endDate
        );

        let income = 0;
        let expense = 0;

        periodTransactions.forEach(t => {
          const amount = parseFloat(t.amount);
          if (t.categoryType === 'income') {
            income += amount;
          } else if (t.categoryType === 'expense') {
            expense += Math.abs(amount);
          }
        });

        const netFlow = income - expense;

        return {
          date: formatDateForGrouping(intervalDate, grouping),
          income,
          expense,
          netFlow,
        };
      });
    } catch (error) {
      console.error('Error getting cash flow data:', error);
      throw new Error('Failed to get cash flow data');
    }
  }

  /**
   * Get spending breakdown by category
   */
  static async getSpendingBreakdown(
    userId: string,
    dateRange: DateRange,
    accountIds?: string[],
    _includeSubcategories: boolean = false
  ): Promise<SpendingCategory[]> {
    try {
      const transactionConditions = [
        eq(transactions.userId, userId),
        gte(transactions.transactionDate, dateRange.startDate),
        lte(transactions.transactionDate, dateRange.endDate),
        eq(categories.type, 'expense'), // Only expense categories
      ];

      if (accountIds && accountIds.length > 0) {
        transactionConditions.push(inArray(transactions.accountId, accountIds));
      }

      // Get spending by category
      const spendingData = await db
        .select({
          categoryId: categories.id,
          categoryName: categories.name,
          categoryColor: categories.color,
          totalAmount: sql<string>`SUM(ABS(${transactions.amount}))`,
          transactionCount: sql<number>`COUNT(*)`,
        })
        .from(transactions)
        .innerJoin(categories, eq(transactions.categoryId, categories.id))
        .where(and(...transactionConditions))
        .groupBy(categories.id, categories.name, categories.color)
        .orderBy(desc(sql`SUM(ABS(${transactions.amount}))`));

      // Calculate total spending for percentage calculation
      const totalSpending = spendingData.reduce((sum, category) => 
        sum + parseFloat(category.totalAmount || '0'), 0
      );

      return spendingData.map(category => {
        const amount = parseFloat(category.totalAmount || '0');
        const percentage = totalSpending > 0 ? (amount / totalSpending) * 100 : 0;

        return {
          categoryId: category.categoryId,
          categoryName: category.categoryName,
          categoryColor: category.categoryColor,
          amount,
          percentage,
          transactionCount: category.transactionCount,
        };
      });
    } catch (error) {
      console.error('Error getting spending breakdown:', error);
      throw new Error('Failed to get spending breakdown');
    }
  }

  /**
   * Get account balance trends over time
   */
  static async getAccountTrends(
    userId: string,
    dateRange: DateRange,
    accountIds?: string[],
    groupBy?: 'day' | 'week' | 'month'
  ): Promise<AccountTrend[]> {
    try {
      const grouping = groupBy || getOptimalGrouping(dateRange);
      
      const accountConditions = [eq(accounts.userId, userId), eq(accounts.isActive, true)];
      
      if (accountIds && accountIds.length > 0) {
        accountConditions.push(inArray(accounts.id, accountIds));
      }

      // Get all relevant accounts
      const accountList = await db
        .select({
          id: accounts.id,
          name: accounts.name,
          type: accounts.type,
          currentBalance: accounts.balance,
        })
        .from(accounts)
        .where(and(...accountConditions));

      const accountTrends: AccountTrend[] = [];

      for (const account of accountList) {
        // Get transactions for this account within the date range
        const accountTransactions = await db
          .select({
            amount: transactions.amount,
            date: transactions.transactionDate,
          })
          .from(transactions)
          .where(and(
            eq(transactions.userId, userId),
            eq(transactions.accountId, account.id),
            lte(transactions.transactionDate, dateRange.endDate)
          ))
          .orderBy(asc(transactions.transactionDate));

        if (accountTransactions.length === 0) {
          // No transactions, use current balance
          accountTrends.push({
            accountId: account.id,
            accountName: account.name,
            accountType: account.type,
            data: [{
              date: formatDateForGrouping(dateRange.endDate, grouping),
              balance: parseFloat(account.currentBalance),
            }],
            growth: 0,
            growthAmount: 0,
          });
          continue;
        }

        // Calculate running balance over time
        const numericTransactions = accountTransactions.map(t => ({
          date: t.date,
          amount: parseFloat(t.amount),
        }));
        const balanceHistory = calculateRunningBalance(numericTransactions, 0);
        
        // Group by intervals
        const intervals = generateDateIntervals(dateRange, grouping);
        const trendData = intervals.map(intervalDate => {
          // Find the last balance entry before or at this interval
          const relevantEntries = balanceHistory.filter(entry => entry.date <= intervalDate);
          const latestEntry = relevantEntries[relevantEntries.length - 1];
          
          return {
            date: formatDateForGrouping(intervalDate, grouping),
            balance: latestEntry ? latestEntry.balance : 0,
          };
        });

        // Calculate growth metrics
        const startBalance = trendData[0]?.balance || 0;
        const endBalance = trendData[trendData.length - 1]?.balance || 0;
        const growthAmount = endBalance - startBalance;
        const growth = startBalance !== 0 ? (growthAmount / Math.abs(startBalance)) * 100 : 0;

        accountTrends.push({
          accountId: account.id,
          accountName: account.name,
          accountType: account.type,
          data: trendData,
          growth,
          growthAmount,
        });
      }

      return accountTrends;
    } catch (error) {
      console.error('Error getting account trends:', error);
      throw new Error('Failed to get account trends');
    }
  }

  /**
   * Get credit card utilization data
   */
  static async getCreditUtilization(
    userId: string,
    dateRange: DateRange,
    accountIds?: string[]
  ): Promise<CreditUtilization[]> {
    try {
      const accountConditions = [
        eq(accounts.userId, userId),
        eq(accounts.type, 'credit_card'),
        eq(accounts.isActive, true),
      ];

      if (accountIds && accountIds.length > 0) {
        accountConditions.push(inArray(accounts.id, accountIds));
      }

      // Get credit card accounts
      const creditCardAccounts = await db
        .select({
          id: accounts.id,
          name: accounts.name,
          balance: accounts.balance,
          creditLimit: accounts.creditLimit,
        })
        .from(accounts)
        .where(and(...accountConditions));

      const utilizationData: CreditUtilization[] = [];

      for (const account of creditCardAccounts) {
        if (!account.creditLimit || parseFloat(account.creditLimit) === 0) {
          continue; // Skip accounts without credit limits
        }

        const currentBalance = parseFloat(account.balance);
        const creditLimit = parseFloat(account.creditLimit);
        const utilizationRate = (Math.abs(currentBalance) / creditLimit) * 100;

        // Get historical transaction data for trend analysis
        const recentTransactions = await db
          .select({
            amount: transactions.amount,
            date: transactions.transactionDate,
          })
          .from(transactions)
          .where(and(
            eq(transactions.userId, userId),
            eq(transactions.accountId, account.id),
            gte(transactions.transactionDate, dateRange.startDate),
            lte(transactions.transactionDate, dateRange.endDate)
          ))
          .orderBy(asc(transactions.transactionDate));

        // Calculate running utilization over the period
        const numericRecentTransactions = recentTransactions.map(t => ({
          date: t.date,
          amount: parseFloat(t.amount),
        }));
        const balanceHistory = calculateRunningBalance(numericRecentTransactions, 0);
        const utilizationHistory = balanceHistory.map(entry => ({
          date: entry.date,
          utilization: (Math.abs(entry.balance) / creditLimit) * 100,
        }));

        // Calculate average and peak utilization
        const utilizationRates = utilizationHistory.map(h => h.utilization);
        const averageUtilization = utilizationRates.length > 0 
          ? utilizationRates.reduce((sum, rate) => sum + rate, 0) / utilizationRates.length 
          : utilizationRate;

        const peakUtilization = utilizationRates.length > 0 
          ? Math.max(...utilizationRates) 
          : utilizationRate;

        const peakEntry = utilizationHistory.find(h => h.utilization === peakUtilization);
        const peakDate = peakEntry ? peakEntry.date.toISOString() : new Date().toISOString();

        // Determine trend
        const firstUtilization = utilizationRates[0] || utilizationRate;
        const lastUtilization = utilizationRates[utilizationRates.length - 1] || utilizationRate;
        const trendDirection = getTrend(lastUtilization, firstUtilization, 2);
        const trend: 'increasing' | 'decreasing' | 'stable' = 
          trendDirection === 'up' ? 'increasing' : 
          trendDirection === 'down' ? 'decreasing' : 'stable';

        utilizationData.push({
          accountId: account.id,
          accountName: account.name,
          currentBalance: Math.abs(currentBalance),
          creditLimit,
          utilizationRate,
          averageUtilization,
          peakUtilization,
          peakDate,
          trend,
        });
      }

      return utilizationData.sort((a, b) => b.utilizationRate - a.utilizationRate);
    } catch (error) {
      console.error('Error getting credit utilization:', error);
      throw new Error('Failed to get credit utilization');
    }
  }

  /**
   * Get net worth history over time
   */
  static async getNetWorthHistory(
    userId: string,
    dateRange: DateRange,
    groupBy?: 'day' | 'week' | 'month'
  ): Promise<NetWorthData[]> {
    try {
      const grouping = groupBy || getOptimalGrouping(dateRange);
      const intervals = generateDateIntervals(dateRange, grouping);

      // Get all user accounts
      const userAccounts = await db
        .select({
          id: accounts.id,
          type: accounts.type,
          currentBalance: accounts.balance,
        })
        .from(accounts)
        .where(and(eq(accounts.userId, userId), eq(accounts.isActive, true)));

      const netWorthHistory: NetWorthData[] = [];

      for (const intervalDate of intervals) {
        let assets = 0;
        let liabilities = 0;

        for (const account of userAccounts) {
          // Get account balance at this point in time
          const transactionsUpToDate = await db
            .select({
              amount: transactions.amount,
            })
            .from(transactions)
            .where(and(
              eq(transactions.userId, userId),
              eq(transactions.accountId, account.id),
              lte(transactions.transactionDate, intervalDate)
            ));

          const accountBalance = transactionsUpToDate.reduce(
            (sum, t) => sum + parseFloat(t.amount), 0
          );

          if (account.type === 'credit_card') {
            liabilities += Math.abs(accountBalance);
          } else {
            assets += accountBalance;
          }
        }

        const netWorth = assets - liabilities;

        netWorthHistory.push({
          date: formatDateForGrouping(intervalDate, grouping),
          assets,
          liabilities,
          netWorth,
        });
      }

      return netWorthHistory;
    } catch (error) {
      console.error('Error getting net worth history:', error);
      throw new Error('Failed to get net worth history');
    }
  }

  /**
   * Get period comparisons (month-over-month, etc.)
   */
  static async getPeriodComparisons(
    userId: string,
    currentPeriod: DateRange,
    previousPeriod: DateRange,
    metrics: string[] = ['income', 'expenses', 'netCashFlow', 'netWorth', 'transactionCount']
  ): Promise<PeriodComparison[]> {
    try {
      // Get overview data for both periods
      const currentData = await this.getOverview(userId, { 
        dateRange: currentPeriod 
      });
      const previousData = await this.getOverview(userId, { 
        dateRange: previousPeriod 
      });

      const comparisons: PeriodComparison[] = [];

      for (const metric of metrics) {
        let currentValue = 0;
        let previousValue = 0;

        switch (metric) {
          case 'income':
            currentValue = currentData.totalIncome;
            previousValue = previousData.totalIncome;
            break;
          case 'expenses':
            currentValue = currentData.totalExpenses;
            previousValue = previousData.totalExpenses;
            break;
          case 'netCashFlow':
            currentValue = currentData.netCashFlow;
            previousValue = previousData.netCashFlow;
            break;
          case 'netWorth':
            currentValue = currentData.netWorth;
            previousValue = previousData.netWorth;
            break;
          case 'transactionCount':
            currentValue = currentData.transactionCount;
            previousValue = previousData.transactionCount;
            break;
          default:
            continue;
        }

        const change = currentValue - previousValue;
        const changePercentage = calculatePercentageChange(currentValue, previousValue);
        const trend = getTrend(currentValue, previousValue);

        comparisons.push({
          metric,
          currentPeriod: currentValue,
          previousPeriod: previousValue,
          change,
          changePercentage,
          trend,
        });
      }

      return comparisons;
    } catch (error) {
      console.error('Error getting period comparisons:', error);
      throw new Error('Failed to get period comparisons');
    }
  }

  /**
   * Get complete analytics dashboard data
   */
  static async getDashboardData(
    userId: string,
    filters: AnalyticsFilters
  ): Promise<AnalyticsDashboardData> {
    try {
      const [
        overview,
        cashFlow,
        spendingBreakdown,
        accountTrends,
        creditUtilization,
        netWorthHistory,
      ] = await Promise.all([
        this.getOverview(userId, filters),
        this.getCashFlow(userId, filters.dateRange, undefined, filters.accountIds),
        this.getSpendingBreakdown(userId, filters.dateRange, filters.accountIds),
        this.getAccountTrends(userId, filters.dateRange, filters.accountIds),
        this.getCreditUtilization(userId, filters.dateRange, filters.accountIds),
        this.getNetWorthHistory(userId, filters.dateRange),
      ]);

      // Generate period comparisons (previous period of same duration)
      const rangeDuration = filters.dateRange.endDate.getTime() - filters.dateRange.startDate.getTime();
      const previousPeriod: DateRange = {
        startDate: new Date(filters.dateRange.startDate.getTime() - rangeDuration),
        endDate: new Date(filters.dateRange.startDate.getTime() - 1),
      };

      const comparisons = await this.getPeriodComparisons(
        userId,
        filters.dateRange,
        previousPeriod
      );

      return {
        overview,
        cashFlow,
        spendingBreakdown,
        accountTrends,
        creditUtilization,
        netWorthHistory,
        comparisons,
      };
    } catch (error) {
      console.error('Error getting dashboard data:', error);
      throw new Error('Failed to get analytics dashboard data');
    }
  }
}
