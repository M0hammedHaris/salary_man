import { describe, it, expect } from 'vitest';
import {
  getPresetDateRange,
  getPreviousPeriod,
  generateDateIntervals,
  getOptimalGrouping,
  formatDateForGrouping,
  formatCurrency,
  formatPercentage,
  calculatePercentageChange,
  getTrend,
  aggregateByDateInterval,
  calculateRunningBalance,
  getChartColor,
  validateDateRange,
  CHART_COLORS,
} from '@/lib/utils/analytics-utils';
import type { DateRange } from '@/lib/types/analytics';

describe('analytics-utils', () => {
  describe('getPresetDateRange', () => {
    it('should return current month range for month preset', () => {
      const range = getPresetDateRange('month');
      expect(range.startDate).toBeInstanceOf(Date);
      expect(range.endDate).toBeInstanceOf(Date);
      expect(range.startDate.getDate()).toBe(1); // First day of month
    });

    it('should return current quarter range for quarter preset', () => {
      const range = getPresetDateRange('quarter');
      expect(range.startDate).toBeInstanceOf(Date);
      expect(range.endDate).toBeInstanceOf(Date);
    });

    it('should return current year range for year preset', () => {
      const range = getPresetDateRange('year');
      expect(range.startDate).toBeInstanceOf(Date);
      expect(range.endDate).toBeInstanceOf(Date);
      expect(range.startDate.getMonth()).toBe(0); // January
      expect(range.startDate.getDate()).toBe(1); // First day
    });
  });

  describe('getPreviousPeriod', () => {
    it('should return previous month for month preset', () => {
      const currentRange: DateRange = {
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-02-29'),
      };
      const previous = getPreviousPeriod(currentRange, 'month');
      
      expect(previous.startDate.getMonth()).toBe(0); // January (0-indexed)
      expect(previous.endDate.getMonth()).toBe(0);
    });

    it('should return previous year for year preset', () => {
      const currentRange: DateRange = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      };
      const previous = getPreviousPeriod(currentRange, 'year');
      
      expect(previous.startDate.getFullYear()).toBe(2023);
      expect(previous.endDate.getFullYear()).toBe(2023);
    });
  });

  describe('generateDateIntervals', () => {
    it('should generate daily intervals', () => {
      const dateRange: DateRange = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-03'),
      };
      const intervals = generateDateIntervals(dateRange, 'day');
      
      expect(intervals).toHaveLength(3);
      // Check the dates are sequential, accounting for timezone
      expect(intervals[0].toDateString()).toBe(new Date('2024-01-01').toDateString());
      expect(intervals[2].toDateString()).toBe(new Date('2024-01-03').toDateString());
    });

    it('should generate weekly intervals', () => {
      const dateRange: DateRange = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-14'),
      };
      const intervals = generateDateIntervals(dateRange, 'week');
      
      expect(intervals.length).toBeGreaterThan(0);
    });
  });

  describe('getOptimalGrouping', () => {
    it('should return day grouping for short periods', () => {
      const dateRange: DateRange = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-15'),
      };
      expect(getOptimalGrouping(dateRange)).toBe('day');
    });

    it('should return week grouping for medium periods', () => {
      const dateRange: DateRange = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-02-29'),
      };
      expect(getOptimalGrouping(dateRange)).toBe('week');
    });

    it('should return month grouping for long periods', () => {
      const dateRange: DateRange = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      };
      expect(getOptimalGrouping(dateRange)).toBe('month');
    });
  });

  describe('formatDateForGrouping', () => {
    const testDate = new Date('2024-01-15');

    it('should format date for day grouping', () => {
      const formatted = formatDateForGrouping(testDate, 'day');
      expect(formatted).toBe('Jan 15');
    });

    it('should format date for week grouping', () => {
      const formatted = formatDateForGrouping(testDate, 'week');
      expect(formatted).toContain('Week of');
    });

    it('should format date for month grouping', () => {
      const formatted = formatDateForGrouping(testDate, 'month');
      expect(formatted).toBe('Jan 2024');
    });
  });

  describe('formatCurrency', () => {
    it('should format currency in INR by default', () => {
      const formatted = formatCurrency(1000);
      expect(formatted).toMatch(/₹/);
      expect(formatted).toContain('1,000');
    });

    it('should format currency with specified currency', () => {
      const formatted = formatCurrency(1000, 'USD');
      expect(formatted).toMatch(/\$/);
    });
  });

  describe('formatPercentage', () => {
    it('should format percentage with default decimals', () => {
      expect(formatPercentage(25.567)).toBe('25.6%');
    });

    it('should format percentage with specified decimals', () => {
      expect(formatPercentage(25.567, 2)).toBe('25.57%');
    });
  });

  describe('calculatePercentageChange', () => {
    it('should calculate positive percentage change', () => {
      expect(calculatePercentageChange(120, 100)).toBe(20);
    });

    it('should calculate negative percentage change', () => {
      expect(calculatePercentageChange(80, 100)).toBe(-20);
    });

    it('should handle zero previous value', () => {
      expect(calculatePercentageChange(100, 0)).toBe(100);
    });
  });

  describe('getTrend', () => {
    it('should return up trend for significant increase', () => {
      expect(getTrend(110, 100)).toBe('up');
    });

    it('should return down trend for significant decrease', () => {
      expect(getTrend(90, 100)).toBe('down');
    });

    it('should return stable trend for small changes', () => {
      expect(getTrend(102, 100)).toBe('stable');
    });
  });

  describe('aggregateByDateInterval', () => {
    it('should aggregate transactions by day', () => {
      const transactions = [
        { date: new Date('2024-01-01'), amount: 100 },
        { date: new Date('2024-01-01'), amount: 50 },
        { date: new Date('2024-01-02'), amount: 75 },
      ];
      
      const dateRange: DateRange = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-02'),
      };
      
      const aggregated = aggregateByDateInterval(transactions, dateRange, 'day');
      
      expect(aggregated).toHaveLength(2);
      expect(aggregated[0].amount).toBe(150); // 100 + 50
      expect(aggregated[1].amount).toBe(75);
    });
  });

  describe('calculateRunningBalance', () => {
    it('should calculate running balance correctly', () => {
      const transactions = [
        { date: new Date('2024-01-01'), amount: 100 },
        { date: new Date('2024-01-02'), amount: -50 },
        { date: new Date('2024-01-03'), amount: 25 },
      ];
      
      const balanceHistory = calculateRunningBalance(transactions, 0);
      
      expect(balanceHistory[0].balance).toBe(0); // Initial
      expect(balanceHistory[1].balance).toBe(100); // After first transaction
      expect(balanceHistory[2].balance).toBe(50); // After second transaction
      expect(balanceHistory[3].balance).toBe(75); // After third transaction
    });
  });

  describe('getChartColor', () => {
    it('should return colors from the chart colors array', () => {
      expect(getChartColor(0)).toBe(CHART_COLORS[0]);
      expect(getChartColor(1)).toBe(CHART_COLORS[1]);
    });

    it('should cycle through colors for large indices', () => {
      const largeIndex = CHART_COLORS.length + 2;
      expect(getChartColor(largeIndex)).toBe(CHART_COLORS[2]);
    });
  });

  describe('validateDateRange', () => {
    it('should validate correct date range', () => {
      const result = validateDateRange(
        new Date('2024-01-01'), 
        new Date('2024-01-31')
      );
      expect(result.isValid).toBe(true);
    });

    it('should reject start date after end date', () => {
      const result = validateDateRange(
        new Date('2024-01-31'), 
        new Date('2024-01-01')
      );
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Start date must be before end date');
    });

    it('should reject date range exceeding 2 years', () => {
      const result = validateDateRange(
        new Date('2020-01-01'), 
        new Date('2024-01-01')
      );
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Date range cannot exceed 2 years');
    });

    it('should reject end date too far in future', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 60); // 60 days in future
      
      const result = validateDateRange(
        new Date(), 
        futureDate
      );
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('End date cannot be more than 30 days in the future');
    });
  });
});
