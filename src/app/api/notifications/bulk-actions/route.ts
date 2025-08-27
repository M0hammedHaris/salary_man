import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { alerts } from '@/lib/db/schema';
import { eq, and, inArray, sql } from 'drizzle-orm';
import { z } from 'zod';

// Validation schemas
const bulkActionSchema = z.object({
  notificationIds: z.array(z.string().uuid()).min(1).max(100),
  action: z.enum(['markAsRead', 'markAsUnread', 'archive', 'unarchive', 'acknowledge', 'dismiss', 'delete']),
  snoozeHours: z.number().min(1).max(168).optional(), // Max 1 week
});

// POST /api/notifications/bulk-actions - Perform bulk actions on multiple notifications
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = bulkActionSchema.parse(body);
    const { notificationIds, action } = validatedData;

    // Verify all notifications belong to the user
    const existingNotifications = await db
      .select({ id: alerts.id })
      .from(alerts)
      .where(and(
        eq(alerts.userId, userId),
        inArray(alerts.id, notificationIds)
      ));

    const existingIds = existingNotifications.map(n => n.id);
    const missingIds = notificationIds.filter(id => !existingIds.includes(id));

    if (missingIds.length > 0) {
      return NextResponse.json(
        { 
          error: 'Some notifications not found or do not belong to user',
          missingIds 
        },
        { status: 404 }
      );
    }

    const updateData: Partial<typeof alerts.$inferInsert> = { 
      updatedAt: new Date() 
    };

    switch (action) {
      case 'markAsRead':
        updateData.readAt = new Date();
        break;
      case 'markAsUnread':
        updateData.readAt = null;
        break;
      case 'archive':
        updateData.archivedAt = new Date();
        break;
      case 'unarchive':
        updateData.archivedAt = null;
        break;
      case 'acknowledge':
        updateData.status = 'acknowledged';
        updateData.acknowledgedAt = new Date();
        break;
      case 'dismiss':
        updateData.status = 'dismissed';
        break;
      case 'delete':
        // For delete, we'll use a separate operation
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    let affectedRows = 0;

    if (action === 'delete') {
      // Delete notifications permanently
      await db
        .delete(alerts)
        .where(and(
          eq(alerts.userId, userId),
          inArray(alerts.id, notificationIds)
        ));
      
      affectedRows = notificationIds.length; // Assume all were deleted
    } else {
      // Update notifications
      const updateResult = await db
        .update(alerts)
        .set(updateData)
        .where(and(
          eq(alerts.userId, userId),
          inArray(alerts.id, notificationIds)
        ))
        .returning({ id: alerts.id });

      affectedRows = updateResult.length;
    }

    // Create audit log entry (optional - for tracking bulk actions)
    // This could be implemented later if needed for compliance

    return NextResponse.json({
      success: true,
      data: {
        action,
        affectedRows,
        notificationIds,
      },
      message: `Successfully performed ${action} on ${affectedRows} notification${affectedRows !== 1 ? 's' : ''}`,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Failed to perform bulk action:', error);
    return NextResponse.json(
      { error: 'Failed to perform bulk action' },
      { status: 500 }
    );
  }
}

// GET /api/notifications/bulk-actions - Get available bulk actions for user
export async function GET(_request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get counts for different notification states to help with bulk action UI
    const totalQuery = await db
      .select({ count: sql<number>`count(*)` })
      .from(alerts)
      .where(eq(alerts.userId, userId));

    const unreadQuery = await db
      .select({ count: sql<number>`count(*)` })
      .from(alerts)
      .where(and(
        eq(alerts.userId, userId),
        eq(alerts.status, 'triggered')
      ));

    const archivedQuery = await db
      .select({ count: sql<number>`count(*)` })
      .from(alerts)
      .where(and(
        eq(alerts.userId, userId),
        sql`${alerts.archivedAt} IS NOT NULL`
      ));

    const dismissedQuery = await db
      .select({ count: sql<number>`count(*)` })
      .from(alerts)
      .where(and(
        eq(alerts.userId, userId),
        eq(alerts.status, 'dismissed')
      ));

    const counts = {
      total: totalQuery[0]?.count || 0,
      unread: unreadQuery[0]?.count || 0,
      archived: archivedQuery[0]?.count || 0,
      dismissed: dismissedQuery[0]?.count || 0,
    };

    const availableActions = [
      {
        action: 'markAsRead',
        label: 'Mark as Read',
        description: 'Mark selected notifications as read',
        icon: 'check',
        disabled: false,
      },
      {
        action: 'markAsUnread',
        label: 'Mark as Unread',
        description: 'Mark selected notifications as unread',
        icon: 'mail',
        disabled: false,
      },
      {
        action: 'archive',
        label: 'Archive',
        description: 'Move selected notifications to archive',
        icon: 'archive',
        disabled: false,
      },
      {
        action: 'unarchive',
        label: 'Unarchive',
        description: 'Remove selected notifications from archive',
        icon: 'unarchive',
        disabled: false,
      },
      {
        action: 'acknowledge',
        label: 'Acknowledge',
        description: 'Acknowledge selected notifications',
        icon: 'check-circle',
        disabled: false,
      },
      {
        action: 'dismiss',
        label: 'Dismiss',
        description: 'Dismiss selected notifications',
        icon: 'x-circle',
        disabled: false,
      },
      {
        action: 'delete',
        label: 'Delete',
        description: 'Permanently delete selected notifications',
        icon: 'trash',
        disabled: false,
        destructive: true,
      },
    ];

    return NextResponse.json({
      success: true,
      data: {
        availableActions,
        counts,
      },
    });

  } catch (error) {
    console.error('Failed to get bulk actions:', error);
    return NextResponse.json(
      { error: 'Failed to get bulk actions' },
      { status: 500 }
    );
  }
}
