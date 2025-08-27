import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { notificationPreferences } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's quiet hours configuration from a general preference record
    const preferences = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId))
      .limit(1);

    if (preferences.length === 0) {
      // Return default quiet hours configuration
      return NextResponse.json({
        enabled: false,
        startTime: '22:00',
        endTime: '08:00',
        timezone: 'UTC',
        emergencyOverride: true,
        weekdaysOnly: false,
        customSchedule: {}
      });
    }

    const userPrefs = preferences[0];
    
    // Parse quiet hours settings from preferences
    const quietHoursConfig = {
      enabled: userPrefs.quietHoursStart && userPrefs.quietHoursEnd ? true : false,
      startTime: userPrefs.quietHoursStart || '22:00',
      endTime: userPrefs.quietHoursEnd || '08:00',
      timezone: userPrefs.timezone || 'UTC',
      emergencyOverride: userPrefs.emergencyOverride ?? true,
      weekdaysOnly: false, // This would need to be added to the schema
      customSchedule: {} // This would need to be added to the schema
    };

    return NextResponse.json(quietHoursConfig);
  } catch (error) {
    console.error('Error fetching quiet hours configuration:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      enabled,
      startTime,
      endTime,
      timezone,
      emergencyOverride,
      // weekdaysOnly, // Not implemented in current schema
      // customSchedule // Not implemented in current schema
    } = body;

    // Validate time format
    if (startTime && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(startTime)) {
      return NextResponse.json(
        { error: 'Invalid start time format' },
        { status: 400 }
      );
    }

    if (endTime && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(endTime)) {
      return NextResponse.json(
        { error: 'Invalid end time format' },
        { status: 400 }
      );
    }

    // Check if user preferences exist (for any alert type)
    const existingPreferences = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId))
      .limit(1);

    const updateData = {
      quietHoursStart: enabled ? startTime : null,
      quietHoursEnd: enabled ? endTime : null,
      timezone,
      emergencyOverride,
      updatedAt: new Date()
    };

    if (existingPreferences.length === 0) {
      // Create new preferences record with default alert type
      await db.insert(notificationPreferences).values({
        userId,
        alertType: 'general', // Default type for quiet hours settings
        ...updateData,
        createdAt: new Date()
      });
    } else {
      // Update existing preferences
      await db
        .update(notificationPreferences)
        .set(updateData)
        .where(eq(notificationPreferences.userId, userId));
    }

    return NextResponse.json({
      message: 'Quiet hours configuration updated successfully'
    });
  } catch (error) {
    console.error('Error updating quiet hours configuration:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
