import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuth } from '@clerk/nextjs/server';
import { BillService } from '@/lib/services/bill-service';

// Request validation schema
const markPaidSchema = z.object({
  paymentDate: z.string().datetime().optional(),
  transactionId: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await getAuth(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: billId } = await params;
    const body = await request.json();
    const validatedData = markPaidSchema.parse(body);

    // Mark bill as paid using service
    const paymentDate = validatedData.paymentDate 
      ? new Date(validatedData.paymentDate) 
      : new Date();

    const updatedBill = await BillService.markBillAsPaid(
      billId,
      userId,
      paymentDate
    );

    if (!updatedBill) {
      return NextResponse.json(
        { error: 'Bill not found or not authorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      bill: updatedBill,
      message: 'Bill marked as paid successfully'
    });
  } catch (error) {
    console.error('Error marking bill as paid:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to mark bill as paid' },
      { status: 500 }
    );
  }
}
