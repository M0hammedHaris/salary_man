import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { AlertService } from '@/lib/services/alert-service';

const dismissSchema = z.object({
  alertId: z.string().uuid(),
});

// POST /api/alerts/dismiss - Dismiss an alert
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { alertId } = dismissSchema.parse(body);

    const dismissedAlert = await AlertService.dismissAlert(alertId, userId);

    if (!dismissedAlert) {
      return NextResponse.json(
        { error: 'Alert not found or not authorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: dismissedAlert,
      message: 'Alert dismissed successfully'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.issues },
        { status: 400 }
      );
    }

    console.error('POST /api/alerts/dismiss error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
