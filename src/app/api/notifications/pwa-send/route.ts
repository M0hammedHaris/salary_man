import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { z } from 'zod';

const PWANotificationSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(1, 'Message is required'),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  alertType: z.string(),
  accountId: z.string().optional(),
  billId: z.string().optional(),
  url: z.string().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
  subscription: z.object({
    endpoint: z.string(),
    keys: z.object({
      p256dh: z.string(),
      auth: z.string()
    })
  }).optional()
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
    const validation = PWANotificationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: validation.error.issues
        },
        { status: 400 }
      );
    }

    const { 
      title, 
      message, 
      priority, 
      alertType, 
      accountId, 
      billId, 
      url, 
      data,
      subscription 
    } = validation.data;

    // Create notification payload for service worker
    const notificationPayload = {
      title,
      message,
      priority,
      alertType,
      accountId,
      billId,
      url: url || '/dashboard/notifications',
      data: {
        userId: user.id,
        ...data
      },
      notificationId: `pwa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };

    // If we have a push subscription, send push notification
    if (subscription) {
      await sendPushNotification(subscription, notificationPayload);
    }

    // Store notification in database for history
    // Note: This would integrate with your notification center service
    // await storeNotificationHistory(user.id, notificationPayload);

    return NextResponse.json({
      success: true,
      notificationId: notificationPayload.notificationId,
      message: 'PWA notification sent successfully'
    });

  } catch (error) {
    console.error('PWA notification error:', error);
    return NextResponse.json(
      { error: 'Failed to send PWA notification' },
      { status: 500 }
    );
  }
}

interface NotificationPayload {
  title: string;
  message: string;
  priority: string;
  alertType: string;
  accountId?: string;
  billId?: string;
  url: string;
  data: Record<string, unknown>;
  notificationId: string;
  timestamp: number;
}

async function sendPushNotification(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: NotificationPayload
) {
  // This is a simplified implementation
  // In production, you would use a library like web-push
  try {
    // For now, just log the push notification
    // In production, install web-push: npm install web-push @types/web-push
    console.log('Push notification would be sent:', {
      subscription: subscription.endpoint,
      payload: payload.title
    });
    
    // Uncomment when web-push is installed:
    // const webpush = await import('web-push');
    // webpush.setVapidDetails(
    //   'mailto:your-email@example.com',
    //   process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    //   process.env.VAPID_PRIVATE_KEY!
    // );
    // 
    // const pushOptions = {
    //   TTL: 60 * 60 * 24, // 24 hours
    //   urgency: getPushUrgency(payload.priority),
    //   topic: payload.alertType
    // };
    // 
    // await webpush.sendNotification(
    //   subscription,
    //   JSON.stringify(payload),
    //   pushOptions
    // );

    console.log('Push notification sent successfully');
  } catch (error) {
    console.error('Failed to send push notification:', error);
    throw error;
  }
}
