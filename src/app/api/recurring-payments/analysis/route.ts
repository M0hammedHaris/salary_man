import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuth } from '@clerk/nextjs/server';
import { RecurringPaymentService } from '@/lib/services/recurring-payment-service';

// Validation schemas
const analysisOptionsSchema = z.object({
  period: z.enum(['monthly', 'quarterly', 'yearly']).default('monthly'),
  includeProjections: z.boolean().default(true),
});

export async function GET(request: NextRequest) {
  try {
    const { userId } = await getAuth(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const url = new URL(request.url);
    const queryParams = {
      period: url.searchParams.get('period') || 'monthly',
      includeProjections: url.searchParams.get('includeProjections') === 'true',
    };

    // Validate query parameters
    const validatedOptions = analysisOptionsSchema.parse(queryParams);

    // Get cost analysis using service
    const costAnalysis = await RecurringPaymentService.getCostAnalysis(userId, validatedOptions);

    return NextResponse.json({
      costAnalysis,
      generatedAt: new Date().toISOString(),
      options: validatedOptions,
    });
  } catch (error) {
    console.error('Error generating cost analysis:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid analysis options', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate cost analysis' },
      { status: 500 }
    );
  }
}
