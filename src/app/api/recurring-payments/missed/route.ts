import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuth } from '@clerk/nextjs/server';
import { RecurringPaymentService } from '@/lib/services/recurring-payment-service';

// Validation schemas
const missedPaymentsQuerySchema = z.object({
  gracePeriodDays: z.coerce.number().min(0).max(30).default(3),
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
      gracePeriodDays: url.searchParams.get('gracePeriodDays') || '3',
    };

    // Validate query parameters
    const validatedQuery = missedPaymentsQuerySchema.parse(queryParams);

    // Get missed payments using service
    const missedPayments = await RecurringPaymentService.detectMissedPayments(
      userId,
      validatedQuery.gracePeriodDays
    );

    // Calculate summary statistics
    const summary = {
      totalMissedPayments: missedPayments.length,
      totalAmountOverdue: missedPayments.reduce(
        (sum, payment) => sum + payment.expectedAmount.toNumber(),
        0
      ),
      averageDaysOverdue: missedPayments.length > 0
        ? Math.round(
            missedPayments.reduce((sum, payment) => sum + payment.daysOverdue, 0) / missedPayments.length
          )
        : 0,
      mostOverduePayment: missedPayments.length > 0
        ? missedPayments.reduce((max, current) =>
            current.daysOverdue > max.daysOverdue ? current : max
          )
        : null,
    };

    return NextResponse.json({
      missedPayments,
      summary,
      gracePeriodDays: validatedQuery.gracePeriodDays,
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching missed payments:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch missed payments' },
      { status: 500 }
    );
  }
}
