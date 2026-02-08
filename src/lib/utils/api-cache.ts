import { NextResponse } from 'next/server';

/**
 * Cache durations for different types of data
 */
export const CACHE_DURATIONS = {
  // Financial data that changes frequently
  ACCOUNTS: {
    maxAge: 60, // 1 minute
    staleWhileRevalidate: 120, // 2 minutes
  },
  // Analytics data that can be slightly stale
  ANALYTICS: {
    maxAge: 120, // 2 minutes
    staleWhileRevalidate: 300, // 5 minutes
  },
  // Transaction data
  TRANSACTIONS: {
    maxAge: 30, // 30 seconds
    staleWhileRevalidate: 60, // 1 minute
  },
  // Notification data
  NOTIFICATIONS: {
    maxAge: 30, // 30 seconds
    staleWhileRevalidate: 60, // 1 minute
  },
  // User preferences (rarely change)
  PREFERENCES: {
    maxAge: 300, // 5 minutes
    staleWhileRevalidate: 600, // 10 minutes
  },
} as const;

/**
 * Creates a NextResponse with appropriate caching headers
 */
export function createCachedResponse<T>(
  data: T,
  cacheConfig: { maxAge: number; staleWhileRevalidate: number }
): NextResponse<T> {
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': `private, max-age=${cacheConfig.maxAge}, stale-while-revalidate=${cacheConfig.staleWhileRevalidate}`,
    },
  });
}

/**
 * Creates a no-cache response for sensitive or real-time data
 */
export function createNoCacheResponse<T>(data: T): NextResponse<T> {
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'private, no-cache, no-store, must-revalidate',
    },
  });
}
