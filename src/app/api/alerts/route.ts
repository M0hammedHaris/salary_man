import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { AlertService } from '@/lib/services/alert-service';

// GET /api/alerts - Retrieve alert history for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);
    const accountId = searchParams.get('accountId') || undefined;
    const status = searchParams.get('status') || undefined;

    // Validate status if provided
    if (status && !['triggered', 'acknowledged', 'snoozed', 'dismissed'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: triggered, acknowledged, snoozed, dismissed' },
        { status: 400 }
      );
    }

    const alerts = await AlertService.getAlertHistory(userId, {
      limit,
      offset,
      accountId,
      status: status as 'triggered' | 'acknowledged' | 'snoozed' | 'dismissed' | undefined
    });

    return NextResponse.json({
      data: alerts,
      pagination: {
        limit,
        offset,
        hasMore: alerts.length === limit
      }
    });

  } catch (error) {
    console.error('GET /api/alerts error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
