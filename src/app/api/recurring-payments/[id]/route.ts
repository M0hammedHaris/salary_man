import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuth } from '@clerk/nextjs/server';
import { RecurringPaymentService } from '@/lib/services/recurring-payment-service';

// Validation schemas
const updateRecurringPaymentSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  frequency: z.enum(['weekly', 'monthly', 'quarterly', 'yearly']).optional(),
  nextDueDate: z.string().datetime().optional(),
  categoryId: z.string().uuid().optional(),
  reminderDays: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await getAuth(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = updateRecurringPaymentSchema.parse(body);

    // Transform string dates to Date objects
    const updateData = {
      ...validatedData,
      nextDueDate: validatedData.nextDueDate ? new Date(validatedData.nextDueDate) : undefined,
    };

    // Update recurring payment using service
    const updatedPayment = await RecurringPaymentService.updateRecurringPayment(
      id,
      userId,
      updateData
    );

    if (!updatedPayment) {
      return NextResponse.json(
        { error: 'Recurring payment not found or not authorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      recurringPayment: updatedPayment,
      message: 'Recurring payment updated successfully'
    });
  } catch (error) {
    console.error('Error updating recurring payment:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update recurring payment' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await getAuth(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 });
    }

    // Cancel recurring payment (mark as inactive) using service
    const cancelledPayment = await RecurringPaymentService.cancelRecurringPayment(id, userId);

    if (!cancelledPayment) {
      return NextResponse.json(
        { error: 'Recurring payment not found or not authorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      recurringPayment: cancelledPayment,
      message: 'Recurring payment cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling recurring payment:', error);
    
    return NextResponse.json(
      { error: 'Failed to cancel recurring payment' },
      { status: 500 }
    );
  }
}
