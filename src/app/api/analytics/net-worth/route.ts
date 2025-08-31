import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { AnalyticsService } from '@/lib/services/analytics-service';
import { z } from 'zod';
import type { NetWorthRequest } from '@/lib/types/analytics';

const netWorthRequestSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  groupBy: z.enum(['day', 'week', 'month']).optional(),
});

// GET /api/analytics/net-worth - Net worth calculation and historical tracking
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams: NetWorthRequest = {
      startDate: searchParams.get('startDate') || '',
      endDate: searchParams.get('endDate') || '',
      groupBy: (searchParams.get('groupBy') as 'day' | 'week' | 'month') || undefined,
    };

    // Validate query parameters
    const validatedQuery = netWorthRequestSchema.parse(queryParams);

    // Convert string dates to Date objects
    const dateRange = {
      startDate: new Date(validatedQuery.startDate),
      endDate: new Date(validatedQuery.endDate),
    };

    const netWorthHistory = await AnalyticsService.getNetWorthHistory(
      userId, 
      dateRange, 
      validatedQuery.groupBy
    );
    
    return NextResponse.json({ netWorthHistory });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error fetching net worth data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch net worth data' }, 
      { status: 500 }
    );
  }
}
