import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { AnalyticsService } from '@/lib/services/analytics-service';
import { z } from 'zod';
import type { CashFlowRequest } from '@/lib/types/analytics';

const cashFlowRequestSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  groupBy: z.enum(['day', 'week', 'month']).optional(),
  accountIds: z.string().optional(),
});

// GET /api/analytics/cash-flow - Income vs expense trends
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams: CashFlowRequest = {
      startDate: searchParams.get('startDate') || '',
      endDate: searchParams.get('endDate') || '',
      groupBy: (searchParams.get('groupBy') as 'day' | 'week' | 'month') || undefined,
      accountIds: searchParams.get('accountIds') || undefined,
    };

    // Validate query parameters
    const validatedQuery = cashFlowRequestSchema.parse(queryParams);
    
    // Parse optional arrays
    const accountIds = validatedQuery.accountIds 
      ? validatedQuery.accountIds.split(',').filter(Boolean)
      : undefined;

    // Convert string dates to Date objects
    const dateRange = {
      startDate: new Date(validatedQuery.startDate),
      endDate: new Date(validatedQuery.endDate),
    };

    const cashFlow = await AnalyticsService.getCashFlow(
      userId, 
      dateRange, 
      validatedQuery.groupBy,
      accountIds
    );
    
    return NextResponse.json({ cashFlow });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error fetching cash flow data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cash flow data' }, 
      { status: 500 }
    );
  }
}
