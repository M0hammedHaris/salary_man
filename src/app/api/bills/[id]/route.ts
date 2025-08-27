import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { recurringPayments, accounts, categories } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// Request validation schemas
const updateBillSchema = z.object({
  name: z.string().min(1, 'Bill name is required').max(100).optional(),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid amount format').optional(),
  frequency: z.enum(['weekly', 'monthly', 'quarterly', 'yearly']).optional(),
  nextDueDate: z.string().datetime().optional(),
  categoryId: z.string().uuid().optional(),
  reminderDays: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await getAuth(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const billId = params.id;

    // Get specific bill with account and category details
    const billResult = await db
      .select({
        bill: recurringPayments,
        account: accounts,
        category: categories,
      })
      .from(recurringPayments)
      .innerJoin(accounts, eq(recurringPayments.accountId, accounts.id))
      .leftJoin(categories, eq(recurringPayments.categoryId, categories.id))
      .where(
        and(
          eq(recurringPayments.id, billId),
          eq(recurringPayments.userId, userId)
        )
      )
      .limit(1);

    if (billResult.length === 0) {
      return NextResponse.json(
        { error: 'Bill not found or not authorized' },
        { status: 404 }
      );
    }

    const { bill, account, category } = billResult[0];

    return NextResponse.json({
      bill: {
        ...bill,
        account,
        category,
      }
    });
  } catch (error) {
    console.error('Error fetching bill:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bill' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await getAuth(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const billId = params.id;
    const body = await request.json();
    const validatedData = updateBillSchema.parse(body);

    // Verify bill belongs to user
    const existingBill = await db
      .select()
      .from(recurringPayments)
      .where(
        and(
          eq(recurringPayments.id, billId),
          eq(recurringPayments.userId, userId)
        )
      )
      .limit(1);

    if (existingBill.length === 0) {
      return NextResponse.json(
        { error: 'Bill not found or not authorized' },
        { status: 404 }
      );
    }

    // If categoryId is being updated, verify it belongs to user
    if (validatedData.categoryId) {
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
    }

    // Prepare update data
    const updateData: Record<string, string | Date | boolean> = {
      updatedAt: new Date(),
    };

    if (validatedData.name) updateData.name = validatedData.name;
    if (validatedData.amount) updateData.amount = validatedData.amount;
    if (validatedData.frequency) updateData.frequency = validatedData.frequency;
    if (validatedData.categoryId) updateData.categoryId = validatedData.categoryId;
    if (validatedData.reminderDays) updateData.reminderDays = validatedData.reminderDays;
    if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive;
    if (validatedData.nextDueDate) {
      updateData.nextDueDate = new Date(validatedData.nextDueDate);
    }

    // Update bill
    const updatedBill = await db
      .update(recurringPayments)
      .set(updateData)
      .where(eq(recurringPayments.id, billId))
      .returning();

    return NextResponse.json({
      bill: updatedBill[0],
      message: 'Bill updated successfully'
    });
  } catch (error) {
    console.error('Error updating bill:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update bill' },
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

    const billId = params.id;

    // Verify bill belongs to user
    const existingBill = await db
      .select()
      .from(recurringPayments)
      .where(
        and(
          eq(recurringPayments.id, billId),
          eq(recurringPayments.userId, userId)
        )
      )
      .limit(1);

    if (existingBill.length === 0) {
      return NextResponse.json(
        { error: 'Bill not found or not authorized' },
        { status: 404 }
      );
    }

    // Soft delete by setting isActive to false
    await db
      .update(recurringPayments)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(recurringPayments.id, billId));

    return NextResponse.json({
      message: 'Bill deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting bill:', error);
    return NextResponse.json(
      { error: 'Failed to delete bill' },
      { status: 500 }
    );
  }
}
