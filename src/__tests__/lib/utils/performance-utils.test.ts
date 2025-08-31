import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
  useDateRangeCalculation,
  useNumberFormatter,
  usePercentageFormatter,
  debounce,
  throttle,
  useLazyLoading,
  useChartDataOptimization,
  useAggregatedCalculations,
  analyticsCache,
  useCachedCalculation,
} from '@/lib/utils/performance-utils';

describe('Performance Utils', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    analyticsCache.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('useDateRangeCalculation', () => {
    it('calculates month range correctly', () => {
      const { result } = renderHook(() => useDateRangeCalculation('month'));
      
      expect(result.current.start).toBeInstanceOf(Date);
      expect(result.current.end).toBeInstanceOf(Date);
      expect(result.current.start.getTime()).toBeLessThan(result.current.end.getTime());
    });

    it('calculates quarter range correctly', () => {
      const { result } = renderHook(() => useDateRangeCalculation('quarter'));
      
      expect(result.current.start).toBeInstanceOf(Date);
      expect(result.current.end).toBeInstanceOf(Date);
    });

    it('calculates year range correctly', () => {
      const { result } = renderHook(() => useDateRangeCalculation('year'));
      
      expect(result.current.start).toBeInstanceOf(Date);
      expect(result.current.end).toBeInstanceOf(Date);
    });

    it('handles custom range', () => {
      const customRange = {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31'),
      };
      
      const { result } = renderHook(() => 
        useDateRangeCalculation('custom', customRange)
      );
      
      expect(result.current.start).toEqual(customRange.start);
      expect(result.current.end).toEqual(customRange.end);
    });
  });

  describe('useNumberFormatter', () => {
    it('formats numbers as INR currency by default', () => {
      const { result } = renderHook(() => useNumberFormatter());
      
      const formatted = result.current.format(1000);
      expect(formatted).toContain('₹');
      expect(formatted).toContain('1,000');
    });

    it('formats numbers with specified currency', () => {
      const { result } = renderHook(() => useNumberFormatter('USD'));
      
      const formatted = result.current.format(1000);
      expect(formatted).toContain('$');
    });
  });

  describe('usePercentageFormatter', () => {
    it('formats numbers as percentages', () => {
      const { result } = renderHook(() => usePercentageFormatter());
      
      const formatted = result.current.format(0.15);
      expect(formatted).toContain('15');
      expect(formatted).toContain('%');
    });
  });

  describe('debounce', () => {
    it('delays function execution', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);
      
      debouncedFn();
      expect(mockFn).not.toHaveBeenCalled();
      
      vi.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('cancels previous calls when called multiple times', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);
      
      debouncedFn();
      debouncedFn();
      debouncedFn();
      
      vi.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('throttle', () => {
    it('limits function execution frequency', () => {
      const mockFn = vi.fn();
      const throttledFn = throttle(mockFn, 100);
      
      throttledFn();
      throttledFn();
      throttledFn();
      
      expect(mockFn).toHaveBeenCalledTimes(1);
      
      vi.advanceTimersByTime(100);
      throttledFn();
      
      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('useLazyLoading', () => {
    it('paginates data correctly', () => {
      const data = Array.from({ length: 150 }, (_, i) => ({ id: i }));
      
      const { result } = renderHook(() => useLazyLoading(data, 50));
      
      expect(result.current.totalPages).toBe(3);
      expect(result.current.totalItems).toBe(150);
      expect(result.current.getPage(0)).toHaveLength(50);
      expect(result.current.getPage(2)).toHaveLength(50);
      expect(result.current.hasNextPage(0)).toBe(true);
      expect(result.current.hasNextPage(2)).toBe(false);
      expect(result.current.hasPreviousPage(0)).toBe(false);
      expect(result.current.hasPreviousPage(1)).toBe(true);
    });

    it('handles small datasets', () => {
      const data = Array.from({ length: 10 }, (_, i) => ({ id: i }));
      
      const { result } = renderHook(() => useLazyLoading(data, 50));
      
      expect(result.current.totalPages).toBe(1);
      expect(result.current.getPage(0)).toHaveLength(10);
    });
  });

  describe('useChartDataOptimization', () => {
    it('optimizes large datasets', () => {
      const data = Array.from({ length: 1000 }, (_, i) => ({ value: i }));
      
      const { result } = renderHook(() => useChartDataOptimization(data, 100));
      
      expect(result.current.length).toBeLessThanOrEqual(101); // 100 + last point
      expect(result.current[0]).toEqual({ value: 0 });
      expect(result.current[result.current.length - 1]).toEqual({ value: 999 });
    });

    it('returns original data for small datasets', () => {
      const data = Array.from({ length: 50 }, (_, i) => ({ value: i }));
      
      const { result } = renderHook(() => useChartDataOptimization(data, 100));
      
      expect(result.current).toEqual(data);
    });
  });

  describe('useAggregatedCalculations', () => {
    it('aggregates data correctly', () => {
      const data = [
        { category: 'food', amount: 100 },
        { category: 'food', amount: 50 },
        { category: 'transport', amount: 200 },
        { category: 'transport', amount: 75 },
      ];
      
      const { result } = renderHook(() => 
        useAggregatedCalculations(data, 'category', 'amount')
      );
      
      expect(result.current).toEqual({
        food: 150,
        transport: 275,
      });
    });

    it('handles empty data', () => {
      const { result } = renderHook(() => 
        useAggregatedCalculations([], 'category', 'amount')
      );
      
      expect(result.current).toEqual({});
    });
  });

  describe('analyticsCache', () => {
    it('stores and retrieves values', () => {
      analyticsCache.set('test-key', { value: 'test' });
      
      const result = analyticsCache.get('test-key');
      expect(result).toEqual({ value: 'test' });
    });

    it('returns null for non-existent keys', () => {
      const result = analyticsCache.get('non-existent');
      expect(result).toBeNull();
    });

    it('expires values after TTL', () => {
      analyticsCache.set('expiring-key', { value: 'test' });
      
      // Advance time beyond TTL (5 minutes = 300000ms)
      vi.advanceTimersByTime(300001);
      
      const result = analyticsCache.get('expiring-key');
      expect(result).toBeNull();
    });

    it('clears cache', () => {
      analyticsCache.set('test1', 'value1');
      analyticsCache.set('test2', 'value2');
      
      expect(analyticsCache.size()).toBe(2);
      
      analyticsCache.clear();
      expect(analyticsCache.size()).toBe(0);
    });
  });

  describe('useCachedCalculation', () => {
    it('caches calculation results', () => {
      const expensiveCalculation = vi.fn(() => ({ result: 'expensive' }));
      
      const { result, rerender } = renderHook(() =>
        useCachedCalculation('test-calc', expensiveCalculation, ['dep1'])
      );
      
      expect(result.current).toEqual({ result: 'expensive' });
      expect(expensiveCalculation).toHaveBeenCalledTimes(1);
      
      // Rerender with same dependencies - should use cache
      rerender();
      expect(expensiveCalculation).toHaveBeenCalledTimes(1);
    });

    it('recalculates when dependencies change', () => {
      const expensiveCalculation = vi.fn(() => ({ result: 'expensive' }));
      
      const { result, rerender } = renderHook(
        ({ deps }) => useCachedCalculation('test-calc', expensiveCalculation, deps),
        { initialProps: { deps: ['dep1'] } }
      );
      
      expect(result.current).toEqual({ result: 'expensive' });
      expect(expensiveCalculation).toHaveBeenCalledTimes(1);
      
      // Rerender with different dependencies - should recalculate
      rerender({ deps: ['dep2'] });
      expect(expensiveCalculation).toHaveBeenCalledTimes(2);
    });
  });
});
