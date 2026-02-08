import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { AnalyticsService } from '@/lib/services/analytics-service';
import { createCachedResponse, CACHE_DURATIONS } from '@/lib/utils/api-cache';
import { z } from 'zod';
import type { AccountTrendsRequest } from '@/lib/types/analytics';

const accountTrendsRequestSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  accountIds: z.string().optional(),
  groupBy: z.enum(['day', 'week', 'month']).optional(),
});

// GET /api/analytics/account-trends - Account balance trend data
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams: AccountTrendsRequest = {
      startDate: searchParams.get('startDate') || '',
      endDate: searchParams.get('endDate') || '',
      accountIds: searchParams.get('accountIds') || undefined,
      groupBy: (searchParams.get('groupBy') as 'day' | 'week' | 'month') || undefined,
    };

    // Validate query parameters
    const validatedQuery = accountTrendsRequestSchema.parse(queryParams);
    
    // Parse optional arrays
    const accountIds = validatedQuery.accountIds 
      ? validatedQuery.accountIds.split(',').filter(Boolean)
      : undefined;

    // Convert string dates to Date objects
    const dateRange = {
      startDate: new Date(validatedQuery.startDate),
      endDate: new Date(validatedQuery.endDate),
    };

    const accountTrends = await AnalyticsService.getAccountTrends(
      userId, 
      dateRange, 
      accountIds,
      validatedQuery.groupBy
    );
    
    return createCachedResponse({ accountTrends }, CACHE_DURATIONS.ANALYTICS);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error fetching account trends:', error);
    return NextResponse.json(
      { error: 'Failed to fetch account trends' }, 
      { status: 500 }
    );
  }
}
