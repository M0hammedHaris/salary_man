'use server';

import { auth } from '@clerk/nextjs/server';
import { savingsService } from '@/lib/services/savings-service';
import { createGoalSchema, updateGoalSchema, type CreateGoalRequest, type UpdateGoalRequest } from '@/lib/types/savings';
import { revalidatePath } from 'next/cache';

export async function getSavingsGoals() {
    const { userId } = await auth();

    if (!userId) {
        throw new Error('Unauthorized');
    }

    const goals = await savingsService.getUserGoals(userId);
    const analytics = await savingsService.getGoalAnalytics(userId);

    return {
        goals: JSON.parse(JSON.stringify(goals)),
        analytics: JSON.parse(JSON.stringify(analytics)),
    };
}

export async function createSavingsGoal(data: CreateGoalRequest) {
    const { userId } = await auth();

    if (!userId) {
        throw new Error('Unauthorized');
    }

    const parsedData = {
        ...data,
        targetDate: typeof data.targetDate === 'string' ? new Date(data.targetDate) : data.targetDate
    };

    const validatedData = createGoalSchema.parse(parsedData);

    const goal = await savingsService.createGoal(userId, {
        name: validatedData.name,
        description: validatedData.description,
        targetAmount: validatedData.targetAmount.toString(),
        targetDate: validatedData.targetDate,
        accountId: validatedData.accountId,
        categoryId: validatedData.categoryId,
        priority: validatedData.priority.toString(),
    });

    revalidatePath('/savings');
    revalidatePath('/dashboard');
    // Revalidate specific goal path if needed, but usually list is enough

    return JSON.parse(JSON.stringify(goal));
}

export async function updateSavingsGoal(id: string, data: UpdateGoalRequest) {
    const { userId } = await auth();

    if (!userId) {
        throw new Error('Unauthorized');
    }

    // Validate request body
    const parsedData = {
        ...data,
        targetDate: data.targetDate ? (typeof data.targetDate === 'string' ? new Date(data.targetDate) : data.targetDate) : undefined
    };

    const validatedData = updateGoalSchema.parse(parsedData);

    const updatedGoal = await savingsService.updateGoal(id, userId, {
        name: validatedData.name,
        description: validatedData.description,
        targetAmount: validatedData.targetAmount?.toString(),
        targetDate: validatedData.targetDate,
        categoryId: validatedData.categoryId,
        priority: validatedData.priority?.toString(),
        status: validatedData.status,
    });

    revalidatePath('/savings');
    revalidatePath(`/savings/${id}`);
    revalidatePath('/dashboard');

    return JSON.parse(JSON.stringify(updatedGoal));
}

export async function deleteSavingsGoal(id: string) {
    const { userId } = await auth();

    if (!userId) {
        throw new Error('Unauthorized');
    }

    await savingsService.deleteGoal(id, userId);

    revalidatePath('/savings');
    revalidatePath('/dashboard');

    return { message: 'Goal deleted successfully' };
}
