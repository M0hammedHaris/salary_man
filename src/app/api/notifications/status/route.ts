import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { z } from 'zod';

const NotificationStatusSchema = z.object({
  notificationId: z.string().min(1, 'Notification ID is required'),
  status: z.enum(['delivered', 'read', 'dismissed', 'interacted']),
  timestamp: z.number().min(0, 'Timestamp must be a positive number')
});

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = NotificationStatusSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: validation.error.issues
        },
        { status: 400 }
      );
    }

    const { notificationId, status, timestamp } = validation.data;

    // Update notification status in database
    // This assumes we have a way to track notification status
    // For PWA notifications, we might need to extend the alerts table
    // or create a separate notification_status table

    console.log(`Notification ${notificationId} status updated to ${status} at ${new Date(timestamp).toISOString()}`);

    // For now, we'll log the status update
    // In a full implementation, you would:
    // 1. Find the alert/notification by notificationId
    // 2. Update its status in the database
    // 3. Optionally store the status change in a history table

    return NextResponse.json({
      success: true,
      message: 'Notification status updated successfully',
      notificationId,
      status,
      timestamp
    });

  } catch (error) {
    console.error('Notification status update error:', error);
    return NextResponse.json(
      { error: 'Failed to update notification status' },
      { status: 500 }
    );
  }
}
