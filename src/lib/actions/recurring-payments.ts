'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { accounts, categories } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { RecurringPaymentService } from '@/lib/services/recurring-payment-service';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

// Request validation schemas (matching API route)
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

const analysisOptionsSchema = z.object({
    period: z.enum(['monthly', 'quarterly', 'yearly']).default('monthly'),
    includeProjections: z.boolean().default(true),
});

const missedPaymentsQuerySchema = z.object({
    gracePeriodDays: z.coerce.number().min(0).max(30).default(3),
});

const updateRecurringPaymentSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    amount: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
    frequency: z.enum(['weekly', 'monthly', 'quarterly', 'yearly']).optional(),
    nextDueDate: z.string().datetime().optional(),
    categoryId: z.string().uuid().optional(),
    reminderDays: z.string().optional(),
    isActive: z.boolean().optional(),
});

export type RecurringPaymentQuery = z.input<typeof recurringPaymentQuerySchema>;
export type CreateRecurringPaymentData = z.input<typeof createRecurringPaymentSchema>;
export type AnalysisOptions = z.input<typeof analysisOptionsSchema>;
export type MissedPaymentsQuery = z.input<typeof missedPaymentsQuerySchema>;
export type UpdateRecurringPaymentData = z.input<typeof updateRecurringPaymentSchema>;

export async function getRecurringPayments(options: RecurringPaymentQuery = {}) {
    const { userId } = await auth();

    if (!userId) {
        throw new Error('Unauthorized');
    }

    // Validate query parameters
    const validatedQuery = recurringPaymentQuerySchema.parse(options);

    // Get user's recurring payments using service
    const payments = await RecurringPaymentService.getRecurringPayments(userId, validatedQuery);

    return {
        recurringPayments: JSON.parse(JSON.stringify(payments)),
        pagination: {
            limit: validatedQuery.limit,
            offset: validatedQuery.offset,
            total: payments.length,
        }
    };
}

export async function createRecurringPayment(data: CreateRecurringPaymentData) {
    const { userId } = await auth();

    if (!userId) {
        throw new Error('Unauthorized');
    }

    const validatedData = createRecurringPaymentSchema.parse(data);

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

    const Decimal = (await import('decimal.js')).default;

    const newRecurringPayment = await RecurringPaymentService.createRecurringPaymentFromPattern(
        userId,
        {
            id: `manual_${Date.now()}`,
            accountId: validatedData.accountId,
            merchantPattern: validatedData.name,
            amounts: [],
            dates: [],
            frequency: validatedData.frequency,
            confidence: 1.0,
            averageAmount: new Decimal(validatedData.amount),
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

    revalidatePath('/recurring-payments');
    revalidatePath('/dashboard');

    return { recurringPayment: JSON.parse(JSON.stringify(newRecurringPayment)), message: 'Recurring payment created successfully' };
}

export async function getRecurringPaymentAnalysis(options: AnalysisOptions = {}) {
    const { userId } = await auth();

    if (!userId) {
        throw new Error('Unauthorized');
    }

    const validatedOptions = analysisOptionsSchema.parse(options);
    const costAnalysis = await RecurringPaymentService.getCostAnalysis(userId, validatedOptions);

    return {
        costAnalysis: JSON.parse(JSON.stringify(costAnalysis)),
        generatedAt: new Date().toISOString(),
        options: validatedOptions,
    };
}

export async function getMissedPayments(options: MissedPaymentsQuery = {}) {
    const { userId } = await auth();

    if (!userId) {
        throw new Error('Unauthorized');
    }

    const validatedQuery = missedPaymentsQuerySchema.parse(options);

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

    return {
        missedPayments: JSON.parse(JSON.stringify(missedPayments)),
        summary: JSON.parse(JSON.stringify(summary)),
        gracePeriodDays: validatedQuery.gracePeriodDays,
        checkedAt: new Date().toISOString(),
    };
}

export async function updateRecurringPayment(id: string, data: UpdateRecurringPaymentData) {
    const { userId } = await auth();

    if (!userId) {
        throw new Error('Unauthorized');
    }

    if (!id) {
        throw new Error('Payment ID is required');
    }

    const validatedData = updateRecurringPaymentSchema.parse(data);

    const updateData = {
        ...validatedData,
        nextDueDate: validatedData.nextDueDate ? new Date(validatedData.nextDueDate) : undefined,
    };

    const updatedPayment = await RecurringPaymentService.updateRecurringPayment(
        id,
        userId,
        updateData
    );

    if (!updatedPayment) {
        throw new Error('Recurring payment not found or not authorized');
    }

    revalidatePath('/recurring-payments');
    revalidatePath('/dashboard');

    return {
        recurringPayment: JSON.parse(JSON.stringify(updatedPayment)),
        message: 'Recurring payment updated successfully'
    };
}

export async function deleteRecurringPayment(id: string) {
    const { userId } = await auth();

    if (!userId) {
        throw new Error('Unauthorized');
    }

    if (!id) {
        throw new Error('Payment ID is required');
    }

    const cancelledPayment = await RecurringPaymentService.cancelRecurringPayment(id, userId);

    if (!cancelledPayment) {
        throw new Error('Recurring payment not found or not authorized');
    }

    revalidatePath('/recurring-payments');
    revalidatePath('/dashboard');

    return {
        recurringPayment: JSON.parse(JSON.stringify(cancelledPayment)),
        message: 'Recurring payment cancelled successfully'
    };
}
