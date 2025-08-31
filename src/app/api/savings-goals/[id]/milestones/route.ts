import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { savingsService } from '@/lib/services/savings-service';
import { goalProgressSchema } from '@/lib/types/savings';
import { z } from 'zod';

export async function POST(
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
    const validatedData = goalProgressSchema.parse({
      ...body,
      goalId: params.id,
    });

    const progressResult = await savingsService.updateGoalProgress(
      validatedData.goalId,
      userId,
      validatedData.transactionId
    );

    // Determine milestone achievement message
    let celebrationMessage = '';
    if (progressResult.milestoneTriggered) {
      celebrationMessage = `Congratulations! You've reached ${progressResult.milestoneTriggered}% of your goal!`;
    }

    return NextResponse.json({
      progressResult,
      celebrationMessage,
    });
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

    console.error('Error recording milestone:', error);
    return NextResponse.json(
      { error: 'Failed to record milestone' },
      { status: 500 }
    );
  }
}
