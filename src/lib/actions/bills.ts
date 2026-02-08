'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { recurringPayments, accounts, categories } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { BillService } from '@/lib/services/bill-service';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

// Validation schemas (replicated from API route)
const createBillSchema = z.object({
    accountId: z.string().uuid(),
    name: z.string().min(1, 'Bill name is required').max(100),
    amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid amount format'),
    frequency: z.enum(['weekly', 'monthly', 'quarterly', 'yearly']),
    nextDueDate: z.string().datetime(),
    categoryId: z.string().uuid(),
    reminderDays: z.string().default('1,3,7'),
});

export type BillQueryOptions = {
    status?: 'pending' | 'paid' | 'overdue' | 'cancelled';
    accountId?: string;
    limit?: number;
    offset?: number;
};

export async function getUserBills(options: BillQueryOptions = {}) {
    const { userId } = await auth();

    if (!userId) {
        throw new Error('Unauthorized');
    }

    // Get user's bills using service
    // Note: BillService.getUserBills expects the options object directly
    // We may need to adapt types if strict compatibility is required, 
    // but based on analysis, it accepts status, accountId, limit, offset.
    const bills = await BillService.getUserBills(userId, {
        status: options.status,
        accountId: options.accountId,
        limit: options.limit || 50,
        offset: options.offset || 0,
    });

    // But Next.js Server Actions can return serializable objects.
    // Drizzle returns Date objects, which are serializable.
    // Decimal objects might need converting if they aren't plain strings/numbers.
    // The BillService returns object with account and category.

    // Return bills directly. Server Actions support Date serialization.
    // BillService returns objects with Date fields, which is what we want.

    return {
        bills,
        pagination: {
            limit: options.limit || 50,
            offset: options.offset || 0,
            total: bills.length,
        }
    };
}

export async function createBill(data: z.infer<typeof createBillSchema>) {
    const { userId } = await auth();

    if (!userId) {
        throw new Error('Unauthorized');
    }

    const validatedData = createBillSchema.parse(data);

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
        throw new Error('Account not found or not authorized');
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
        throw new Error('Category not found or not authorized');
    }

    // Create recurring payment
    const newBill = await db
        .insert(recurringPayments)
        .values({
            userId,
            accountId: validatedData.accountId,
            name: validatedData.name,
            amount: validatedData.amount,
            frequency: validatedData.frequency,
            nextDueDate: new Date(validatedData.nextDueDate),
            categoryId: validatedData.categoryId,
            reminderDays: validatedData.reminderDays,
            isActive: true,
            status: 'pending',
        })
        .returning();

    revalidatePath('/dashboard');
    revalidatePath('/bills');

    return { bill: JSON.parse(JSON.stringify(newBill[0])), message: 'Bill created successfully' };
}

// Schema for updating a bill (partial)
const updateBillSchema = createBillSchema.partial().extend({
    id: z.string().uuid(),
});

export async function updateBill(data: z.infer<typeof updateBillSchema>) {
    const { userId } = await auth();
    if (!userId) {
        throw new Error('Unauthorized');
    }

    const { id, ...updateData } = updateBillSchema.parse(data);

    // Verify ownership
    const existingBill = await db
        .select()
        .from(recurringPayments)
        .where(
            and(
                eq(recurringPayments.id, id),
                eq(recurringPayments.userId, userId)
            )
        )
        .limit(1);

    if (existingBill.length === 0) {
        throw new Error('Bill not found or unauthorized');
    }

    // Process update data
    const updateValues: Record<string, unknown> = { ...updateData };
    if (updateData.nextDueDate) {
        updateValues.nextDueDate = new Date(updateData.nextDueDate);
    }

    const updatedBill = await db
        .update(recurringPayments)
        .set(updateValues)
        .where(eq(recurringPayments.id, id))
        .returning();

    revalidatePath('/dashboard');
    revalidatePath('/bills');

    return { bill: JSON.parse(JSON.stringify(updatedBill[0])), message: 'Bill updated successfully' };
}

export async function deleteBill(billId: string) {
    const { userId } = await auth();
    if (!userId) {
        throw new Error('Unauthorized');
    }

    // Verify ownership
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
        throw new Error('Bill not found or unauthorized');
    }

    await db
        .delete(recurringPayments)
        .where(eq(recurringPayments.id, billId));

    revalidatePath('/dashboard');
    revalidatePath('/bills');

    return { message: 'Bill deleted successfully' };
}
