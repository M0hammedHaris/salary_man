import { useMemo } from 'react';
import { subDays, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from 'date-fns';

/**
 * Performance optimization utilities for analytics calculations
 */

/**
 * Efficient hash function for creating cache keys from dependencies
 */
function createDependencyHash(dependencies: unknown[]): string {
  let hash = 0;
  const str = dependencies.map(dep => {
    if (dep === null) return 'null';
    if (dep === undefined) return 'undefined';
    if (typeof dep === 'object') {
      // For objects, create a simple hash based on constructor and key count
      if (dep instanceof Date) return dep.getTime().toString();
      if (Array.isArray(dep)) return `arr_${dep.length}`;
      return `obj_${Object.keys(dep as object).length}`;
    }
    return String(dep);
  }).join('|');
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return hash.toString(36); // Base36 for shorter strings
}

/**
 * Fast primitive-only dependency comparison for React hooks
 * More efficient than JSON.stringify for simple values
 */
function createPrimitiveDependencyKey(dependencies: (string | number | boolean | null | undefined)[]): string {
  return dependencies.map(dep => dep ?? 'null').join('|');
}

/**
 * Optimized hook for calculations with primitive dependencies only
 * Use this when dependencies are simple primitive values for better performance.
 * 
 * @example
 * const result = useCachedPrimitiveCalculation(
 *   'simpleCalculation',
 *   () => amount * rate,
 *   [amount, rate, userId]
 * );
 */
export function useCachedPrimitiveCalculation<T>(
  key: string,
  calculationFn: () => T,
  dependencies: (string | number | boolean | null | undefined)[]
): T {
  const primitiveKey = useMemo(() => createPrimitiveDependencyKey(dependencies), [dependencies]);
  
  return useMemo(() => {
    const cacheKey = `${key}_${primitiveKey}`;
    
    // Try to get from cache first
    const cached = analyticsCache.get<T>(cacheKey);
    if (cached !== null) {
      return cached;
    }
    
    // Calculate and cache the result
    const result = calculationFn();
    analyticsCache.set(cacheKey, result);
    
    return result;
  }, [key, calculationFn, primitiveKey]);
}

/**
 * Memoized date range calculator for analytics
 */
export function useDateRangeCalculation(timeframe: 'month' | 'quarter' | 'year' | 'custom', customRange?: { start: Date; end: Date }) {
  return useMemo(() => {
    const now = new Date();
    
    switch (timeframe) {
      case 'month':
        return {
          start: startOfMonth(now),
          end: endOfMonth(now),
        };
      case 'quarter':
        return {
          start: startOfQuarter(now),
          end: endOfQuarter(now),
        };
      case 'year':
        return {
          start: startOfYear(now),
          end: endOfYear(now),
        };
      case 'custom':
        return customRange || {
          start: subDays(now, 30),
          end: now,
        };
      default:
        return {
          start: subDays(now, 30),
          end: now,
        };
    }
  }, [timeframe, customRange]);
}

/**
 * Memoized number formatter for financial values
 */
export function useNumberFormatter(currency: string = 'INR') {
  return useMemo(() => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }, [currency]);
}

/**
 * Memoized percentage formatter
 */
export function usePercentageFormatter() {
  return useMemo(() => {
    return new Intl.NumberFormat('en-IN', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
  }, []);
}

/**
 * Debounced function utility for expensive operations
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttled function utility for frequent operations
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Lazy loading utility for large datasets
 */
export function useLazyLoading<T>(
  data: T[],
  pageSize: number = 50
) {
  return useMemo(() => {
    const totalPages = Math.ceil(data.length / pageSize);
    
    const getPage = (page: number): T[] => {
      const startIndex = page * pageSize;
      const endIndex = Math.min(startIndex + pageSize, data.length);
      return data.slice(startIndex, endIndex);
    };
    
    return {
      totalPages,
      totalItems: data.length,
      getPage,
      hasNextPage: (currentPage: number) => currentPage < totalPages - 1,
      hasPreviousPage: (currentPage: number) => currentPage > 0,
    };
  }, [data, pageSize]);
}

/**
 * Memoized chart data transformation for large datasets
 */
export function useChartDataOptimization<T>(
  data: T[],
  maxDataPoints: number = 100
) {
  return useMemo(() => {
    if (data.length <= maxDataPoints) {
      return data;
    }
    
    // Sample data evenly across the dataset
    const step = Math.floor(data.length / maxDataPoints);
    const optimizedData: T[] = [];
    
    for (let i = 0; i < data.length; i += step) {
      optimizedData.push(data[i]);
    }
    
    // Always include the last data point
    if (optimizedData[optimizedData.length - 1] !== data[data.length - 1]) {
      optimizedData.push(data[data.length - 1]);
    }
    
    return optimizedData;
  }, [data, maxDataPoints]);
}

/**
 * Memory-efficient aggregation for large transaction datasets
 */
export function useAggregatedCalculations<T>(
  data: T[],
  aggregationKey: keyof T,
  valueKey: keyof T
) {
  return useMemo(() => {
    const aggregated = new Map<string, number>();
    
    for (const item of data) {
      const key = String(item[aggregationKey]);
      const value = Number(item[valueKey]) || 0;
      aggregated.set(key, (aggregated.get(key) || 0) + value);
    }
    
    return Object.fromEntries(aggregated);
  }, [data, aggregationKey, valueKey]);
}

/**
 * Caching utility for expensive calculations
 */
class CalculationCache {
  private cache = new Map<string, { value: unknown; timestamp: number }>();
  private ttl: number;
  
  constructor(ttlMinutes: number = 5) {
    this.ttl = ttlMinutes * 60 * 1000; // Convert to milliseconds
  }
  
  get<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.value as T;
  }
  
  set<T>(key: string, value: T): void {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    });
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  size(): number {
    return this.cache.size;
  }
}

// Global analytics cache instance
export const analyticsCache = new CalculationCache(5); // 5-minute TTL

/**
 * Hook for cached calculations with efficient dependency tracking
 * 
 * Use this for complex calculations with mixed dependency types.
 * For primitive-only dependencies, consider using useCachedPrimitiveCalculation instead.
 * 
 * @example
 * const expensiveResult = useCachedCalculation(
 *   'monthlyAnalytics',
 *   () => calculateMonthlyAnalytics(transactions, goals),
 *   [transactions, goals, selectedMonth]
 * );
 */
export function useCachedCalculation<T>(
  key: string,
  calculationFn: () => T,
  dependencies: unknown[]
): T {
  // Create a stable dependency hash for React's useMemo
  const dependencyHash = useMemo(() => createDependencyHash(dependencies), [dependencies]);
  
  return useMemo(() => {
    const cacheKey = `${key}_${dependencyHash}`;
    
    // Try to get from cache first
    const cached = analyticsCache.get<T>(cacheKey);
    if (cached !== null) {
      return cached;
    }
    
    // Calculate and cache the result
    const result = calculationFn();
    analyticsCache.set(cacheKey, result);
    
    return result;
  }, [key, calculationFn, dependencyHash]);
}
