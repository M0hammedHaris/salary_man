import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { savingsService } from '@/lib/services/savings-service';
import { updateGoalSchema } from '@/lib/types/savings';
import { z } from 'zod';

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const body = await request.json();
    
    // Validate request body
    const validatedData = updateGoalSchema.parse({
      ...body,
      targetDate: body.targetDate ? new Date(body.targetDate) : undefined,
    });

    const updatedGoal = await savingsService.updateGoal(params.id, userId, {
      name: validatedData.name,
      description: validatedData.description,
      targetAmount: validatedData.targetAmount?.toString(),
      targetDate: validatedData.targetDate,
      categoryId: validatedData.categoryId,
      priority: validatedData.priority?.toString(),
      status: validatedData.status,
    });

    return NextResponse.json(updatedGoal);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message === 'Goal not found') {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    console.error('Error updating savings goal:', error);
    return NextResponse.json(
      { error: 'Failed to update savings goal' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    await savingsService.deleteGoal(params.id, userId);

    return NextResponse.json({ message: 'Goal deleted successfully' });
  } catch (error) {
    if (error instanceof Error && error.message === 'Goal not found') {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    console.error('Error deleting savings goal:', error);
    return NextResponse.json(
      { error: 'Failed to delete savings goal' },
      { status: 500 }
    );
  }
}
