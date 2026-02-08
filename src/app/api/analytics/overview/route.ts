import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { AnalyticsService } from '@/lib/services/analytics-service';
import { createCachedResponse, CACHE_DURATIONS } from '@/lib/utils/api-cache';
import { z } from 'zod';
import type { AnalyticsOverviewRequest } from '@/lib/types/analytics';

const overviewRequestSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  accountIds: z.string().optional(),
  categoryIds: z.string().optional(),
});

// GET /api/analytics/overview - Dashboard summary data
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams: AnalyticsOverviewRequest = {
      startDate: searchParams.get('startDate') || '',
      endDate: searchParams.get('endDate') || '',
      accountIds: searchParams.get('accountIds') || undefined,
      categoryIds: searchParams.get('categoryIds') || undefined,
    };

    // Validate query parameters
    const validatedQuery = overviewRequestSchema.parse(queryParams);
    
    // Parse optional arrays
    const accountIds = validatedQuery.accountIds 
      ? validatedQuery.accountIds.split(',').filter(Boolean)
      : undefined;
    const categoryIds = validatedQuery.categoryIds 
      ? validatedQuery.categoryIds.split(',').filter(Boolean)
      : undefined;

    // Convert string dates to Date objects
    const filters = {
      dateRange: {
        startDate: new Date(validatedQuery.startDate),
        endDate: new Date(validatedQuery.endDate),
      },
      accountIds,
      categoryIds,
    };

    const overview = await AnalyticsService.getOverview(userId, filters);
    
    return createCachedResponse({ overview }, CACHE_DURATIONS.ANALYTICS);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error fetching analytics overview:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics overview' }, 
      { status: 500 }
    );
  }
}
