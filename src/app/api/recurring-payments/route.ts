import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { accounts, categories } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { RecurringPaymentService } from '@/lib/services/recurring-payment-service';

// Request validation schemas
const recurringPaymentQuerySchema = z.object({
  status: z.enum(['pending', 'paid', 'overdue', 'cancelled']).optional(),
  accountId: z.string().uuid().optional(),
  frequency: z.enum(['weekly', 'monthly', 'quarterly', 'yearly']).optional(),
  isActive: z.coerce.boolean().optional().default(true),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

const createRecurringPaymentSchema = z.object({
  accountId: z.string().uuid(),
  name: z.string().min(1, 'Payment name is required').max(100),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid amount format'),
  frequency: z.enum(['weekly', 'monthly', 'quarterly', 'yearly']),
  nextDueDate: z.string().datetime(),
  categoryId: z.string().uuid(),
  reminderDays: z.string().default('1,3,7'),
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
      status: url.searchParams.get('status') || undefined,
      accountId: url.searchParams.get('accountId') || undefined,
      frequency: url.searchParams.get('frequency') || undefined,
      isActive: url.searchParams.get('isActive') || undefined,
      limit: url.searchParams.get('limit') || undefined,
      offset: url.searchParams.get('offset') || undefined,
    };

    // Validate query parameters
    const validatedQuery = recurringPaymentQuerySchema.parse(queryParams);

    // Get user's recurring payments using service
    const recurringPayments = await RecurringPaymentService.getRecurringPayments(userId, validatedQuery);

    return NextResponse.json({ 
      recurringPayments,
      pagination: {
        limit: validatedQuery.limit,
        offset: validatedQuery.offset,
        total: recurringPayments.length,
      }
    });
  } catch (error) {
    console.error('Error fetching recurring payments:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch recurring payments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await getAuth(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createRecurringPaymentSchema.parse(body);

    // Verify account belongs to user
    const account = await db
      .select()
      .from(accounts)
      .where(
        and(
          eq(accounts.id, validatedData.accountId),
          eq(accounts.userId, userId)
        )
      )
      .limit(1);

    if (account.length === 0) {
      return NextResponse.json(
        { error: 'Account not found or not authorized' },
        { status: 404 }
      );
    }

    // Verify category belongs to user
    const category = await db
      .select()
      .from(categories)
      .where(
        and(
          eq(categories.id, validatedData.categoryId),
          eq(categories.userId, userId)
        )
      )
      .limit(1);

    if (category.length === 0) {
      return NextResponse.json(
        { error: 'Category not found or not authorized' },
        { status: 404 }
      );
    }

    // Create recurring payment using service
    const newRecurringPayment = await RecurringPaymentService.createRecurringPaymentFromPattern(
      userId,
      {
        id: `manual_${Date.now()}`,
        accountId: validatedData.accountId,
        merchantPattern: validatedData.name,
        amounts: [],
        dates: [],
        frequency: validatedData.frequency,
        confidence: 1.0, // Manual creation has full confidence
        averageAmount: new (await import('decimal.js')).default(validatedData.amount),
        lastOccurrence: new Date(),
        nextExpectedDate: new Date(validatedData.nextDueDate),
        categoryId: validatedData.categoryId,
      },
      {
        name: validatedData.name,
        amount: validatedData.amount,
        frequency: validatedData.frequency,
        nextDueDate: new Date(validatedData.nextDueDate),
        categoryId: validatedData.categoryId,
        reminderDays: validatedData.reminderDays,
      }
    );

    return NextResponse.json(
      { recurringPayment: newRecurringPayment, message: 'Recurring payment created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating recurring payment:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create recurring payment' },
      { status: 500 }
    );
  }
}
