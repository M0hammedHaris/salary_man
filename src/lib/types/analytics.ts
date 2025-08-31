export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface DateRangeType {
  label: string;
  value: 'month' | 'quarter' | 'year' | 'custom';
  days: number;
}

export interface CashFlowData {
  date: string;
  income: number;
  expense: number;
  netFlow: number;
}

export interface SpendingCategory {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  amount: number;
  percentage: number;
  transactionCount: number;
}

export interface AccountTrend {
  accountId: string;
  accountName: string;
  accountType: string;
  data: Array<{
    date: string;
    balance: number;
  }>;
  growth: number; // percentage change
  growthAmount: number; // absolute change
}

export interface CreditUtilization {
  accountId: string;
  accountName: string;
  currentBalance: number;
  creditLimit: number;
  utilizationRate: number;
  averageUtilization: number;
  peakUtilization: number;
  peakDate: string;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface PeriodComparison {
  metric: string;
  currentPeriod: number;
  previousPeriod: number;
  change: number;
  changePercentage: number;
  trend: 'up' | 'down' | 'stable';
}

export interface FinancialComparison {
  current: number;
  previous: number;
  change: number;
  percentChange: number;
}

export interface AnalyticsComparisons {
  incomeChange: FinancialComparison;
  expenseChange: FinancialComparison;
  savingsChange: FinancialComparison;
  netWorthChange: FinancialComparison;
}

export interface NetWorthData {
  date: string;
  assets: number;
  liabilities: number;
  netWorth: number;
}

export interface AnalyticsOverview {
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  transactionCount: number;
  accountCount: number;
  averageTransactionValue: number;
  period: DateRange;
}

export interface AnalyticsFilters {
  dateRange: DateRange;
  accountIds?: string[];
  categoryIds?: string[];
  accountTypes?: string[];
}

export interface AnalyticsDashboardData {
  overview: AnalyticsOverview;
  cashFlow: CashFlowData[];
  spendingBreakdown: SpendingCategory[];
  accountTrends: AccountTrend[];
  creditUtilization: CreditUtilization[];
  netWorthHistory: NetWorthData[];
  comparisons: PeriodComparison[];
}

// Request/Response types for API endpoints
export interface AnalyticsOverviewRequest {
  startDate: string;
  endDate: string;
  accountIds?: string;
  categoryIds?: string;
}

export interface AnalyticsOverviewResponse {
  overview: AnalyticsOverview;
}

export interface CashFlowRequest {
  startDate: string;
  endDate: string;
  groupBy?: 'day' | 'week' | 'month';
  accountIds?: string;
}

export interface CashFlowResponse {
  cashFlow: CashFlowData[];
}

export interface SpendingBreakdownRequest {
  startDate: string;
  endDate: string;
  accountIds?: string;
  includeSubcategories?: boolean;
}

export interface SpendingBreakdownResponse {
  spendingBreakdown: SpendingCategory[];
}

export interface AccountTrendsRequest {
  startDate: string;
  endDate: string;
  accountIds?: string;
  groupBy?: 'day' | 'week' | 'month';
}

export interface AccountTrendsResponse {
  accountTrends: AccountTrend[];
}

export interface CreditUtilizationRequest {
  startDate: string;
  endDate: string;
  accountIds?: string;
}

export interface CreditUtilizationResponse {
  creditUtilization: CreditUtilization[];
}

export interface NetWorthRequest {
  startDate: string;
  endDate: string;
  groupBy?: 'day' | 'week' | 'month';
}

export interface NetWorthResponse {
  netWorthHistory: NetWorthData[];
}

export interface ComparisonsRequest {
  currentStartDate: string;
  currentEndDate: string;
  previousStartDate: string;
  previousEndDate: string;
  metrics?: string[];
}

export interface ComparisonsResponse {
  comparisons: PeriodComparison[];
}
