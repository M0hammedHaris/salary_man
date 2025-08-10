import { repositories } from '@/lib/db/repositories';
import { toDecimal, addAmounts, formatCurrency } from '@/lib/utils/decimal';
import { Decimal } from 'decimal.js';
import { createOrUpdateUser } from '@/lib/auth/user-sync';
import { currentUser } from '@clerk/nextjs/server';

export interface DashboardData {
  financialHealthScore: {
    score: number;
    trend: 'up' | 'down' | 'stable';
    explanation: string;
  };
  accountSummary: {
    totalBalance: number;
    checkingBalance: number;
    savingsBalance: number;
    creditCardBalance: number;
    accounts: Array<{
      id: string;
      name: string;
      type: string;
      balance: number;
      status: 'positive' | 'negative' | 'alert';
    }>;
  };
  creditCardUtilization: Array<{
    accountId: string;
    accountName: string;
    utilization: number;
    balance: number;
    creditLimit: number;
    status: 'good' | 'warning' | 'danger';
  }>;
  recentTransactions: Array<{
    id: string;
    description: string;
    amount: number;
    categoryName: string;
    categoryColor: string;
    transactionDate: Date;
    accountName: string;
  }>;
  alerts: Array<{
    id: string;
    type: 'warning' | 'info' | 'error';
    priority: 'high' | 'medium' | 'low';
    message: string;
    actionRequired: boolean;
  }>;
}

/**
 * Calculate financial health score based on account balances and transaction patterns
 */
function calculateFinancialHealthScore(
  totalBalance: Decimal,
  creditUtilization: number,
  recentTransactionCount: number
): { score: number; trend: 'up' | 'down' | 'stable'; explanation: string } {
  let score = 50; // Start at neutral

  // Positive balance contributes to score
  if (totalBalance.greaterThan(0)) {
    const balanceScore = Math.min(totalBalance.toNumber() / 1000 * 10, 30);
    score += balanceScore;
  } else {
    score -= 20; // Negative balance penalty
  }

  // Credit utilization impact
  if (creditUtilization < 30) {
    score += 15;
  } else if (creditUtilization > 70) {
    score -= 20;
  }

  // Activity bonus
  if (recentTransactionCount > 0) {
    score += 5;
  }

  // Clamp score between 0 and 100
  score = Math.max(0, Math.min(100, score));

  // Simple trend calculation (would be based on historical data in real app)
  const trend: 'up' | 'down' | 'stable' = score >= 70 ? 'up' : score <= 40 ? 'down' : 'stable';

  const explanation = `Your score is based on account balances (${Math.round(totalBalance.toNumber())}), credit utilization (${creditUtilization}%), and recent activity.`;

  return { score: Math.round(score), trend, explanation };
}

/**
 * Determine account status based on balance and type
 */
function getAccountStatus(balance: Decimal, type: string): 'positive' | 'negative' | 'alert' {
  if (type === 'credit_card') {
    // For credit cards, negative balance means debt
    return balance.greaterThanOrEqualTo(0) ? 'positive' : balance.lessThan(-1000) ? 'alert' : 'negative';
  }
  
  // For other accounts, negative balance is concerning
  return balance.greaterThan(100) ? 'positive' : balance.lessThan(0) ? 'alert' : 'negative';
}

/**
 * Calculate credit utilization status
 */
function getCreditUtilizationStatus(utilization: number): 'good' | 'warning' | 'danger' {
  if (utilization < 30) return 'good';
  if (utilization < 70) return 'warning';
  return 'danger';
}

/**
 * Generate alerts based on account states and patterns
 */
function generateAlerts(
  accounts: Array<{
    id: string;
    balance: string;
    type: string;
    name: string;
  }>,
  creditUtilization: Array<{
    accountId: string;
    accountName: string;
    utilization: number;
  }>,
  userPreferences: {
    alertThresholds?: {
      lowBalance?: number;
      creditCard?: number;
    };
  } | null
): DashboardData['alerts'] {
  const alerts: DashboardData['alerts'] = [];

  // Low balance alerts
  accounts.forEach((account) => {
    const balance = toDecimal(account.balance);
    if (balance && balance.lessThan(userPreferences?.alertThresholds?.lowBalance || 100) && account.type !== 'credit_card') {
      alerts.push({
        id: `low-balance-${account.id}`,
        type: 'warning',
        priority: 'medium',
        message: `Low balance alert: ${account.name} has ${formatCurrency(balance)}`,
        actionRequired: true,
      });
    }
  });

  // High credit utilization alerts
  creditUtilization.forEach((card) => {
    if (card.utilization > (userPreferences?.alertThresholds?.creditCard || 80)) {
      alerts.push({
        id: `high-utilization-${card.accountId}`,
        type: 'error',
        priority: 'high',
        message: `High credit utilization: ${card.accountName} at ${card.utilization}%`,
        actionRequired: true,
      });
    }
  });

  return alerts;
}

/**
 * Fetch all dashboard data for a user
 */
export async function getDashboardData(userId: string): Promise<DashboardData> {
  try {
    // Fetch all required data in parallel
    const [user, accounts, transactions, categories] = await Promise.all([
      repositories.users.findById(userId),
      repositories.accounts.findByUserId(userId),
      repositories.transactions.findByUserId(userId, 5), // Get 5 most recent
      repositories.categories.findByUserId(userId),
    ]);

    // If user doesn't exist in our database, try to sync from Clerk
    let dbUser = user;
    if (!dbUser) {
      console.log('User not found in database, attempting to sync from Clerk...');
      try {
        const clerkUser = await currentUser();
        if (clerkUser) {
          const email = clerkUser.emailAddresses[0]?.emailAddress;
          if (email) {
            dbUser = await createOrUpdateUser({
              id: clerkUser.id,
              email,
              firstName: clerkUser.firstName || '',
              lastName: clerkUser.lastName || '',
            });
            console.log('Successfully synced user from Clerk:', dbUser?.id);
          }
        }
      } catch (syncError) {
        console.error('Failed to sync user from Clerk:', syncError);
      }
    }

    if (!dbUser) {
      throw new Error('User not found and could not be synced from Clerk');
    }

    // Process accounts
    const processedAccounts = accounts.map((account) => {
      const balance = toDecimal(account.balance) || new Decimal(0);
      return {
        id: account.id,
        name: account.name,
        type: account.type,
        balance,
        status: getAccountStatus(balance, account.type),
      };
    });

    // Calculate balances by type
    const checkingAccounts = processedAccounts.filter(a => a.type === 'checking');
    const savingsAccounts = processedAccounts.filter(a => a.type === 'savings');
    const creditCardAccounts = processedAccounts.filter(a => a.type === 'credit_card');

    const checkingBalance = addAmounts(...checkingAccounts.map(a => a.balance));
    const savingsBalance = addAmounts(...savingsAccounts.map(a => a.balance));
    const creditCardBalance = addAmounts(...creditCardAccounts.map(a => a.balance));
    const totalBalance = checkingBalance.plus(savingsBalance).plus(creditCardBalance);

    // Calculate credit utilization
    const creditCardUtilization = creditCardAccounts.map((account) => {
      const creditLimitStr = accounts.find(a => a.id === account.id)?.creditLimit;
      const creditLimit = toDecimal(creditLimitStr || null) || new Decimal(0);
      const utilization = creditLimit.greaterThan(0) 
        ? account.balance.abs().div(creditLimit).mul(100).toNumber()
        : 0;

      return {
        accountId: account.id,
        accountName: account.name,
        utilization: Math.round(utilization),
        balance: account.balance,
        creditLimit,
        status: getCreditUtilizationStatus(utilization),
      };
    });

    const avgUtilization = creditCardUtilization.length > 0
      ? creditCardUtilization.reduce((sum, card) => sum + card.utilization, 0) / creditCardUtilization.length
      : 0;

    // Process recent transactions
    const categoryMap = new Map(categories.map(cat => [cat.id, cat]));
    const accountMap = new Map(accounts.map(acc => [acc.id, acc]));

    const recentTransactions = transactions.map((transaction) => {
      const category = categoryMap.get(transaction.categoryId);
      const account = accountMap.get(transaction.accountId);

      return {
        id: transaction.id,
        description: transaction.description,
        amount: toDecimal(transaction.amount) || new Decimal(0),
        categoryName: category?.name || 'Uncategorized',
        categoryColor: category?.color || '#6b7280',
        transactionDate: new Date(transaction.transactionDate),
        accountName: account?.name || 'Unknown Account',
      };
    });

    // Calculate financial health score
    const financialHealthScore = calculateFinancialHealthScore(
      totalBalance,
      avgUtilization,
      transactions.length
    );

    // Generate alerts
    const alerts = generateAlerts(accounts, creditCardUtilization, dbUser.preferences || {});

    return {
      financialHealthScore,
      accountSummary: {
        totalBalance: totalBalance.toNumber(),
        checkingBalance: checkingBalance.toNumber(),
        savingsBalance: savingsBalance.toNumber(),
        creditCardBalance: creditCardBalance.toNumber(),
        accounts: processedAccounts.map(account => ({
          ...account,
          balance: account.balance.toNumber(),
        })),
      },
      creditCardUtilization: creditCardUtilization.map(card => ({
        ...card,
        balance: card.balance.toNumber(),
        creditLimit: card.creditLimit.toNumber(),
      })),
      recentTransactions: recentTransactions.map(transaction => ({
        ...transaction,
        amount: transaction.amount.toNumber(),
      })),
      alerts,
    };

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw new Error('Failed to fetch dashboard data');
  }
}
