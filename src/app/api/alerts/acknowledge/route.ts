import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { AlertService } from '@/lib/services/alert-service';

const acknowledgeSchema = z.object({
  alertId: z.string().uuid(),
});

// POST /api/alerts/acknowledge - Acknowledge an alert
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { alertId } = acknowledgeSchema.parse(body);

    const acknowledgedAlert = await AlertService.acknowledgeAlert(alertId, userId);

    if (!acknowledgedAlert) {
      return NextResponse.json(
        { error: 'Alert not found or not authorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: acknowledgedAlert,
      message: 'Alert acknowledged successfully'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.issues },
        { status: 400 }
      );
    }

    console.error('POST /api/alerts/acknowledge error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
