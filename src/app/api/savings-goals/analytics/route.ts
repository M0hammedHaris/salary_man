import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { savingsService } from '@/lib/services/savings-service';

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const analytics = await savingsService.getGoalAnalytics(userId);

    return NextResponse.json({
      analytics,
    });
  } catch (error) {
    console.error('Error fetching goal analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch goal analytics' },
      { status: 500 }
    );
  }
}
