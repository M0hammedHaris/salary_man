import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { AnalyticsService } from '@/lib/services/analytics-service';
import { z } from 'zod';

const comparisonsRequestSchema = z.object({
  currentStartDate: z.string().datetime(),
  currentEndDate: z.string().datetime(),
  previousStartDate: z.string().datetime(),
  previousEndDate: z.string().datetime(),
  metrics: z.string().optional(),
});

// Update the interface to match actual usage
interface ComparisonsRequestInternal {
  currentStartDate: string;
  currentEndDate: string;
  previousStartDate: string;
  previousEndDate: string;
  metrics?: string;
}

// GET /api/analytics/comparisons - Period-based comparisons
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams: ComparisonsRequestInternal = {
      currentStartDate: searchParams.get('currentStartDate') || '',
      currentEndDate: searchParams.get('currentEndDate') || '',
      previousStartDate: searchParams.get('previousStartDate') || '',
      previousEndDate: searchParams.get('previousEndDate') || '',
      metrics: searchParams.get('metrics') || undefined,
    };

    // Validate query parameters
    const validatedQuery = comparisonsRequestSchema.parse(queryParams);
    
    // Parse optional metrics array
    const metrics = validatedQuery.metrics 
      ? validatedQuery.metrics.split(',').filter(Boolean)
      : undefined;

    // Convert string dates to Date objects
    const currentPeriod = {
      startDate: new Date(validatedQuery.currentStartDate),
      endDate: new Date(validatedQuery.currentEndDate),
    };

    const previousPeriod = {
      startDate: new Date(validatedQuery.previousStartDate),
      endDate: new Date(validatedQuery.previousEndDate),
    };

    const comparisons = await AnalyticsService.getPeriodComparisons(
      userId, 
      currentPeriod, 
      previousPeriod,
      metrics
    );
    
    return NextResponse.json({ comparisons });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error fetching period comparisons:', error);
    return NextResponse.json(
      { error: 'Failed to fetch period comparisons' }, 
      { status: 500 }
    );
  }
}
