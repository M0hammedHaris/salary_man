import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { AnalyticsService } from '@/lib/services/analytics-service';
import { createCachedResponse, CACHE_DURATIONS } from '@/lib/utils/api-cache';
import { z } from 'zod';
import type { CreditUtilizationRequest } from '@/lib/types/analytics';

const creditUtilizationRequestSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  accountIds: z.string().optional(),
});

// GET /api/analytics/credit-utilization - Credit card usage analysis
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams: CreditUtilizationRequest = {
      startDate: searchParams.get('startDate') || '',
      endDate: searchParams.get('endDate') || '',
      accountIds: searchParams.get('accountIds') || undefined,
    };

    // Validate query parameters
    const validatedQuery = creditUtilizationRequestSchema.parse(queryParams);
    
    // Parse optional arrays
    const accountIds = validatedQuery.accountIds 
      ? validatedQuery.accountIds.split(',').filter(Boolean)
      : undefined;

    // Convert string dates to Date objects
    const dateRange = {
      startDate: new Date(validatedQuery.startDate),
      endDate: new Date(validatedQuery.endDate),
    };

    const creditUtilization = await AnalyticsService.getCreditUtilization(
      userId, 
      dateRange, 
      accountIds
    );
    
    return createCachedResponse({ creditUtilization }, CACHE_DURATIONS.ANALYTICS);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error fetching credit utilization:', error);
    return NextResponse.json(
      { error: 'Failed to fetch credit utilization' }, 
      { status: 500 }
    );
  }
}
