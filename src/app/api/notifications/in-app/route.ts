import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';

const inAppNotificationSchema = z.object({
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  type: z.enum(['info', 'warning', 'error', 'success']),
  billId: z.string().optional(),
  billName: z.string().optional(),
  dueDate: z.string().optional(),
  amount: z.string().optional(),
  daysUntilDue: z.number().optional(),
  notificationType: z.enum(['bill_reminder', 'insufficient_funds', 'payment_confirmation']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
});

// POST /api/notifications/in-app - Send in-app notification
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = inAppNotificationSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { 
      title, 
      message, 
      type, 
      billId, 
      billName, 
      dueDate, 
      amount, 
      daysUntilDue,
      notificationType,
      priority 
    } = validation.data;

    // In-app notifications are handled by the client-side notification provider
    // This endpoint is primarily for logging and potential server-side tracking
    console.log('IN-APP NOTIFICATION:', {
      userId,
      title,
      message,
      type,
      billId,
      billName,
      dueDate,
      amount,
      daysUntilDue,
      notificationType,
      priority,
      timestamp: new Date().toISOString(),
    });

    // In a real implementation, you might want to:
    // 1. Store the notification in the database for notification history
    // 2. Send real-time notification via WebSocket or Server-Sent Events
    // 3. Update notification counters or badges

    return NextResponse.json({
      success: true,
      message: 'In-app notification processed successfully',
      data: {
        title,
        type,
        billName,
        dueDate,
        priority,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('POST /api/notifications/in-app error:', error);
    return NextResponse.json(
      { error: 'Failed to process in-app notification' },
      { status: 500 }
    );
  }
}
