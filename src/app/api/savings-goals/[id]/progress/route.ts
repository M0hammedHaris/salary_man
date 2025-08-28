import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { savingsService } from '@/lib/services/savings-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projection = await savingsService.getTimelineProjection(params.id, userId);

    return NextResponse.json({
      projection,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Goal not found') {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    console.error('Error fetching goal progress:', error);
    return NextResponse.json(
      { error: 'Failed to fetch goal progress' },
      { status: 500 }
    );
  }
}
