import { DateRange, DateRangeType } from '@/lib/types/analytics';
import { 
  startOfMonth, 
  endOfMonth, 
  startOfQuarter, 
  endOfQuarter, 
  startOfYear, 
  endOfYear,
  subMonths,
  subQuarters,
  subYears,
  format,
  differenceInDays,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  startOfWeek,
  startOfDay
} from 'date-fns';

export const DATE_RANGE_PRESETS: DateRangeType[] = [
  { label: 'This Month', value: 'month', days: 30 },
  { label: 'This Quarter', value: 'quarter', days: 90 },
  { label: 'This Year', value: 'year', days: 365 },
  { label: 'Custom Range', value: 'custom', days: 0 },
];

/**
 * Get date range for preset periods
 */
export function getPresetDateRange(preset: DateRangeType['value']): DateRange {
  const now = new Date();
  
  switch (preset) {
    case 'month':
      return {
        startDate: startOfMonth(now),
        endDate: endOfMonth(now),
      };
    case 'quarter':
      return {
        startDate: startOfQuarter(now),
        endDate: endOfQuarter(now),
      };
    case 'year':
      return {
        startDate: startOfYear(now),
        endDate: endOfYear(now),
      };
    default:
      return {
        startDate: startOfMonth(now),
        endDate: endOfMonth(now),
      };
  }
}

/**
 * Get previous period for comparison
 */
export function getPreviousPeriod(currentRange: DateRange, preset: DateRangeType['value']): DateRange {
  const { startDate, endDate } = currentRange;
  
  switch (preset) {
    case 'month':
      return {
        startDate: startOfMonth(subMonths(startDate, 1)),
        endDate: endOfMonth(subMonths(endDate, 1)),
      };
    case 'quarter':
      return {
        startDate: startOfQuarter(subQuarters(startDate, 1)),
        endDate: endOfQuarter(subQuarters(endDate, 1)),
      };
    case 'year':
      return {
        startDate: startOfYear(subYears(startDate, 1)),
        endDate: endOfYear(subYears(endDate, 1)),
      };
    default:
      // For custom ranges, use the same duration backwards
      const duration = differenceInDays(endDate, startDate);
      const previousEndDate = new Date(startDate.getTime() - 24 * 60 * 60 * 1000); // One day before start
      const previousStartDate = new Date(previousEndDate.getTime() - duration * 24 * 60 * 60 * 1000);
      return {
        startDate: previousStartDate,
        endDate: previousEndDate,
      };
  }
}

/**
 * Generate date intervals for grouping data
 */
export function generateDateIntervals(
  dateRange: DateRange, 
  groupBy: 'day' | 'week' | 'month'
): Date[] {
  const { startDate, endDate } = dateRange;
  
  switch (groupBy) {
    case 'day':
      return eachDayOfInterval({ start: startDate, end: endDate });
    case 'week':
      return eachWeekOfInterval({ start: startDate, end: endDate }, { weekStartsOn: 1 });
    case 'month':
      return eachMonthOfInterval({ start: startDate, end: endDate });
    default:
      return eachDayOfInterval({ start: startDate, end: endDate });
  }
}

/**
 * Determine optimal grouping based on date range
 */
export function getOptimalGrouping(dateRange: DateRange): 'day' | 'week' | 'month' {
  const days = differenceInDays(dateRange.endDate, dateRange.startDate);
  
  if (days <= 31) {
    return 'day';
  } else if (days <= 90) {
    return 'week';
  } else {
    return 'month';
  }
}

/**
 * Format date for display based on grouping
 */
export function formatDateForGrouping(date: Date, groupBy: 'day' | 'week' | 'month'): string {
  switch (groupBy) {
    case 'day':
      return format(date, 'MMM dd');
    case 'week':
      return `Week of ${format(startOfWeek(date, { weekStartsOn: 1 }), 'MMM dd')}`;
    case 'month':
      return format(date, 'MMM yyyy');
    default:
      return format(date, 'MMM dd');
  }
}

/**
 * Format currency values
 */
export function formatCurrency(amount: number, currency: string = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format percentage values
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Calculate percentage change
 */
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return ((current - previous) / Math.abs(previous)) * 100;
}

/**
 * Determine trend direction
 */
export function getTrend(current: number, previous: number, threshold: number = 5): 'up' | 'down' | 'stable' {
  const changePercent = calculatePercentageChange(current, previous);
  
  if (Math.abs(changePercent) < threshold) {
    return 'stable';
  }
  
  return changePercent > 0 ? 'up' : 'down';
}

/**
 * Aggregate transactions by date intervals
 */
export function aggregateByDateInterval<T extends { date: Date; amount: number }>(
  transactions: T[],
  dateRange: DateRange,
  groupBy: 'day' | 'week' | 'month'
): Array<{ date: string; amount: number; count: number }> {
  const intervals = generateDateIntervals(dateRange, groupBy);
  
  return intervals.map(intervalDate => {
    let startDate: Date;
    let endDate: Date;
    
    switch (groupBy) {
      case 'day':
        startDate = startOfDay(intervalDate);
        endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000 - 1);
        break;
      case 'week':
        startDate = startOfWeek(intervalDate, { weekStartsOn: 1 });
        endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
        break;
      case 'month':
        startDate = startOfMonth(intervalDate);
        endDate = endOfMonth(intervalDate);
        break;
      default:
        startDate = startOfDay(intervalDate);
        endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000 - 1);
    }
    
    const periodTransactions = transactions.filter(t => 
      t.date >= startDate && t.date <= endDate
    );
    
    const totalAmount = periodTransactions.reduce((sum, t) => sum + t.amount, 0);
    
    return {
      date: formatDateForGrouping(intervalDate, groupBy),
      amount: totalAmount,
      count: periodTransactions.length,
    };
  });
}

/**
 * Calculate running balance from transactions
 */
export function calculateRunningBalance(
  transactions: Array<{ date: Date; amount: number }>,
  initialBalance: number = 0
): Array<{ date: Date; balance: number }> {
  const sortedTransactions = [...transactions].sort((a, b) => a.date.getTime() - b.date.getTime());
  
  let runningBalance = initialBalance;
  const balanceHistory: Array<{ date: Date; balance: number }> = [
    { date: sortedTransactions[0]?.date || new Date(), balance: initialBalance }
  ];
  
  for (const transaction of sortedTransactions) {
    runningBalance += transaction.amount;
    balanceHistory.push({
      date: transaction.date,
      balance: runningBalance,
    });
  }
  
  return balanceHistory;
}

/**
 * Generate chart colors
 */
export const CHART_COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1',
  '#d084d0', '#ffb347', '#87ceeb', '#dda0dd', '#98fb98',
  '#f0e68c', '#ff6347', '#40e0d0', '#ee82ee', '#90ee90'
];

export function getChartColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length];
}

/**
 * Validate date range
 */
export function validateDateRange(startDate: Date, endDate: Date): { isValid: boolean; error?: string } {
  if (startDate > endDate) {
    return { isValid: false, error: 'Start date must be before end date' };
  }
  
  const maxRange = 365 * 2; // 2 years
  const daysDiff = differenceInDays(endDate, startDate);
  
  if (daysDiff > maxRange) {
    return { isValid: false, error: 'Date range cannot exceed 2 years' };
  }
  
  const futureLimit = new Date();
  futureLimit.setDate(futureLimit.getDate() + 30); // Allow 30 days in future
  
  if (endDate > futureLimit) {
    return { isValid: false, error: 'End date cannot be more than 30 days in the future' };
  }
  
  return { isValid: true };
}
