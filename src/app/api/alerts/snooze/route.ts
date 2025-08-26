import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { AlertService } from '@/lib/services/alert-service';

const snoozeSchema = z.object({
  alertId: z.string().uuid(),
  snoozeMinutes: z.number().min(5).max(1440).default(60), // 5 minutes to 24 hours
});

// POST /api/alerts/snooze - Snooze an alert
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { alertId, snoozeMinutes } = snoozeSchema.parse(body);

    const snoozedAlert = await AlertService.snoozeAlert(alertId, userId, snoozeMinutes);

    if (!snoozedAlert) {
      return NextResponse.json(
        { error: 'Alert not found or not authorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: snoozedAlert,
      message: `Alert snoozed for ${snoozeMinutes} minutes`
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.issues },
        { status: 400 }
      );
    }

    console.error('POST /api/alerts/snooze error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
