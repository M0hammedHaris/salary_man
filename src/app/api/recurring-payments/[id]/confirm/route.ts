import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { recurringPayments } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { RecurringPaymentService } from '@/lib/services/recurring-payment-service';

// Validation schemas
const confirmPatternSchema = z.object({
  createRecurringPayment: z.boolean().default(true),
  patternData: z.object({
    name: z.string().min(1).max(100),
    amount: z.string().regex(/^\d+(\.\d{1,2})?$/),
    frequency: z.enum(['weekly', 'monthly', 'quarterly', 'yearly']),
    nextDueDate: z.string().datetime(),
    categoryId: z.string().uuid(),
    reminderDays: z.string().default('1,3,7'),
  }),
});

export async function POST(
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
      return NextResponse.json({ error: 'Pattern ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = confirmPatternSchema.parse(body);

    if (validatedData.createRecurringPayment) {
      // Check if this pattern already exists as a recurring payment
      const existingPayment = await db
        .select()
        .from(recurringPayments)
        .where(
          and(
            eq(recurringPayments.userId, userId),
            eq(recurringPayments.name, validatedData.patternData.name),
            eq(recurringPayments.isActive, true)
          )
        )
        .limit(1);

      if (existingPayment.length > 0) {
        return NextResponse.json(
          { error: 'Recurring payment with this name already exists' },
          { status: 409 }
        );
      }

      // Create recurring payment from confirmed pattern
      const newRecurringPayment = await RecurringPaymentService.createRecurringPaymentFromPattern(
        userId,
        {
          id: id,
          accountId: '', // Will be set from patternData
          merchantPattern: validatedData.patternData.name,
          amounts: [],
          dates: [],
          frequency: validatedData.patternData.frequency,
          confidence: 1.0, // Confirmed by user
          averageAmount: new (await import('decimal.js')).default(validatedData.patternData.amount),
          lastOccurrence: new Date(),
          nextExpectedDate: new Date(validatedData.patternData.nextDueDate),
          categoryId: validatedData.patternData.categoryId,
        },
        {
          name: validatedData.patternData.name,
          amount: validatedData.patternData.amount,
          frequency: validatedData.patternData.frequency,
          nextDueDate: new Date(validatedData.patternData.nextDueDate),
          categoryId: validatedData.patternData.categoryId,
          reminderDays: validatedData.patternData.reminderDays,
        }
      );

      return NextResponse.json({
        recurringPayment: newRecurringPayment,
        message: 'Recurring payment pattern confirmed and created successfully',
        status: 'created'
      }, { status: 201 });
    } else {
      // Pattern was confirmed but user chose not to create recurring payment
      return NextResponse.json({
        message: 'Pattern confirmed but not created',
        status: 'acknowledged'
      });
    }

  } catch (error) {
    console.error('Error confirming pattern:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid confirmation data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to confirm pattern' },
      { status: 500 }
    );
  }
}
