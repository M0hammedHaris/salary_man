import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { AlertService } from '@/lib/services/alert-service';

const alertSettingsUpdateSchema = z.object({
  thresholdPercentage: z.number().min(0).max(100).optional(),
  thresholdAmount: z.number().min(0).optional(),
  isEnabled: z.boolean().optional()
});

const alertSettingsSchema = z.object({
  accountId: z.string().uuid(),
  alertType: z.enum(['credit_utilization']),
  settings: alertSettingsUpdateSchema
});

const getSettingsParamsSchema = z.object({
  accountId: z.string().uuid().optional(),
});

// GET /api/alerts/settings - Get alert settings for user
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId') || undefined;

    const validation = getSettingsParamsSchema.safeParse({ accountId });
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: validation.error.issues },
        { status: 400 }
      );
    }

    const settings = await AlertService.getAlertSettings(userId, accountId);

    return NextResponse.json({
      data: settings
    });

  } catch (error) {
    console.error('GET /api/alerts/settings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/alerts/settings - Update alert settings
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { accountId, alertType, settings } = alertSettingsSchema.parse(body);

    const updatedSettings = await AlertService.upsertAlertSettings(
      userId,
      accountId,
      alertType,
      settings
    );

    return NextResponse.json({
      data: updatedSettings,
      message: 'Alert settings updated successfully'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.issues },
        { status: 400 }
      );
    }

    console.error('POST /api/alerts/settings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
