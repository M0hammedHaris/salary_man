import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { notificationPreferences } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

// Validation schemas
const notificationPreferencesSchema = z.object({
  alertType: z.string().min(1),
  emailEnabled: z.boolean().optional().default(true),
  pushEnabled: z.boolean().optional().default(true),
  inAppEnabled: z.boolean().optional().default(true),
  smsEnabled: z.boolean().optional().default(false),
  frequencyLimit: z.string().transform(val => val ? Number(val).toString() : null).optional(),
  quietHoursStart: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  quietHoursEnd: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  timezone: z.string().optional().default('UTC'),
  emergencyOverride: z.boolean().optional().default(false),
});

const bulkPreferencesSchema = z.object({
  preferences: z.array(notificationPreferencesSchema),
});

// GET /api/notifications/preferences - Get all notification preferences for user
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const alertType = searchParams.get('alertType');

    let query = db.select().from(notificationPreferences).where(eq(notificationPreferences.userId, userId));

    if (alertType) {
      query = db.select().from(notificationPreferences)
        .where(and(
          eq(notificationPreferences.userId, userId),
          eq(notificationPreferences.alertType, alertType)
        ));
    }

    const preferences = await query;

    return NextResponse.json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    console.error('Failed to fetch notification preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification preferences' },
      { status: 500 }
    );
  }
}

// POST /api/notifications/preferences - Create or update notification preferences
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Check if this is a bulk update
    if (body.preferences && Array.isArray(body.preferences)) {
      const validatedData = bulkPreferencesSchema.parse(body);
      
      const results = await Promise.all(
        validatedData.preferences.map(async (pref) => {
          const existingPref = await db.select()
            .from(notificationPreferences)
            .where(and(
              eq(notificationPreferences.userId, userId),
              eq(notificationPreferences.alertType, pref.alertType)
            ))
            .limit(1);

          if (existingPref.length > 0) {
            // Update existing preference
            const [updated] = await db.update(notificationPreferences)
              .set({
                emailEnabled: pref.emailEnabled,
                pushEnabled: pref.pushEnabled,
                inAppEnabled: pref.inAppEnabled,
                smsEnabled: pref.smsEnabled,
                frequencyLimit: pref.frequencyLimit || null,
                quietHoursStart: pref.quietHoursStart || null,
                quietHoursEnd: pref.quietHoursEnd || null,
                timezone: pref.timezone,
                emergencyOverride: pref.emergencyOverride,
                updatedAt: new Date(),
              })
              .where(and(
                eq(notificationPreferences.userId, userId),
                eq(notificationPreferences.alertType, pref.alertType)
              ))
              .returning();
            return updated;
          } else {
            // Create new preference
            const [created] = await db.insert(notificationPreferences)
              .values({
                alertType: pref.alertType,
                userId,
                emailEnabled: pref.emailEnabled,
                pushEnabled: pref.pushEnabled,
                inAppEnabled: pref.inAppEnabled,
                smsEnabled: pref.smsEnabled,
                frequencyLimit: pref.frequencyLimit || null,
                quietHoursStart: pref.quietHoursStart || null,
                quietHoursEnd: pref.quietHoursEnd || null,
                timezone: pref.timezone,
                emergencyOverride: pref.emergencyOverride,
                createdAt: new Date(),
                updatedAt: new Date(),
              })
              .returning();
            return created;
          }
        })
      );

      return NextResponse.json({
        success: true,
        data: results,
        message: 'Notification preferences updated successfully',
      });
    } else {
      // Single preference update
      const validatedData = notificationPreferencesSchema.parse(body);

      const existingPref = await db.select()
        .from(notificationPreferences)
        .where(and(
          eq(notificationPreferences.userId, userId),
          eq(notificationPreferences.alertType, validatedData.alertType)
        ))
        .limit(1);

      let result;
      if (existingPref.length > 0) {
        // Update existing preference
        const [updated] = await db.update(notificationPreferences)
          .set({
            emailEnabled: validatedData.emailEnabled,
            pushEnabled: validatedData.pushEnabled,
            inAppEnabled: validatedData.inAppEnabled,
            smsEnabled: validatedData.smsEnabled,
            frequencyLimit: validatedData.frequencyLimit || null,
            quietHoursStart: validatedData.quietHoursStart || null,
            quietHoursEnd: validatedData.quietHoursEnd || null,
            timezone: validatedData.timezone,
            emergencyOverride: validatedData.emergencyOverride,
            updatedAt: new Date(),
          })
          .where(and(
            eq(notificationPreferences.userId, userId),
            eq(notificationPreferences.alertType, validatedData.alertType)
          ))
          .returning();
        result = updated;
      } else {
        // Create new preference
        const [created] = await db.insert(notificationPreferences)
          .values({
            alertType: validatedData.alertType,
            userId,
            emailEnabled: validatedData.emailEnabled,
            pushEnabled: validatedData.pushEnabled,
            inAppEnabled: validatedData.inAppEnabled,
            smsEnabled: validatedData.smsEnabled,
            frequencyLimit: validatedData.frequencyLimit || null,
            quietHoursStart: validatedData.quietHoursStart || null,
            quietHoursEnd: validatedData.quietHoursEnd || null,
            timezone: validatedData.timezone,
            emergencyOverride: validatedData.emergencyOverride,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();
        result = created;
      }

      return NextResponse.json({
        success: true,
        data: result,
        message: 'Notification preference updated successfully',
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Failed to update notification preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update notification preferences' },
      { status: 500 }
    );
  }
}

// PUT /api/notifications/preferences - Update notification preferences (alias for POST)
export async function PUT(request: NextRequest) {
  return POST(request);
}

// DELETE /api/notifications/preferences - Reset notification preferences to defaults
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const alertType = searchParams.get('alertType');

    if (alertType) {
      // Delete specific alert type preference
      await db.delete(notificationPreferences)
        .where(and(
          eq(notificationPreferences.userId, userId),
          eq(notificationPreferences.alertType, alertType)
        ));
    } else {
      // Delete all user preferences
      await db.delete(notificationPreferences)
        .where(eq(notificationPreferences.userId, userId));
    }

    return NextResponse.json({
      success: true,
      message: alertType 
        ? `Notification preferences for ${alertType} reset to defaults`
        : 'All notification preferences reset to defaults',
    });
  } catch (error) {
    console.error('Failed to reset notification preferences:', error);
    return NextResponse.json(
      { error: 'Failed to reset notification preferences' },
      { status: 500 }
    );
  }
}
