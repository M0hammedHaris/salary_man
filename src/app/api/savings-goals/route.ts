import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { savingsService } from '@/lib/services/savings-service';
import { createGoalSchema } from '@/lib/types/savings';
import { z } from 'zod';

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const goals = await savingsService.getUserGoals(userId);
    const analytics = await savingsService.getGoalAnalytics(userId);

    return NextResponse.json({
      goals,
      analytics,
    });
  } catch (error) {
    console.error('Error fetching savings goals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch savings goals' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate request body
    const validatedData = createGoalSchema.parse({
      ...body,
      targetDate: new Date(body.targetDate),
    });

    const goal = await savingsService.createGoal(userId, {
      name: validatedData.name,
      description: validatedData.description,
      targetAmount: validatedData.targetAmount.toString(),
      targetDate: validatedData.targetDate,
      accountId: validatedData.accountId,
      categoryId: validatedData.categoryId,
      priority: validatedData.priority.toString(),
    });

    return NextResponse.json(goal, { status: 201 });
    } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }    console.error('Error creating savings goal:', error);
    return NextResponse.json(
      { error: 'Failed to create savings goal' },
      { status: 500 }
    );
  }
}
