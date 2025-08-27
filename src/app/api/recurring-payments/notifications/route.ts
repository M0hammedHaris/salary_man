import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { RecurringPaymentService } from '@/lib/services/recurring-payment-service';

const recurringPaymentNotificationSchema = z.object({
  title: z.string(),
  message: z.string(),
  type: z.enum(['info', 'warning', 'error', 'success']),
  paymentId: z.string().optional(),
  paymentName: z.string().optional(),
  amount: z.number().optional(),
  dueDate: z.string().optional(),
  daysOverdue: z.number().optional(),
  notificationType: z.enum(['recurring_payment_due', 'recurring_payment_missed', 'recurring_payment_confirmed', 'pattern_detected']),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  channels: z.array(z.enum(['email', 'push', 'inApp'])).default(['inApp']),
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const notification = recurringPaymentNotificationSchema.parse(body);

    // Send notification through various channels
    const response = await fetch('/api/notifications/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        priority: notification.priority,
        channels: notification.channels,
        metadata: {
          paymentId: notification.paymentId,
          paymentName: notification.paymentName,
          amount: notification.amount,
          dueDate: notification.dueDate,
          daysOverdue: notification.daysOverdue,
          notificationType: notification.notificationType,
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send notification');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending recurring payment notification:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid notification data', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}

// Endpoint to process missed payment notifications
export async function GET(_request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const missedPayments = await RecurringPaymentService.getMissedPayments(userId);

    // Send notifications for each missed payment
    const notifications = [];
    for (const payment of missedPayments) {
      const daysOverdue = Math.floor(
        (new Date().getTime() - new Date(payment.nextDueDate).getTime()) / (1000 * 60 * 60 * 24)
      );

      const priority = daysOverdue > 7 ? 'high' : daysOverdue > 3 ? 'medium' : 'low';
      
      const notification = {
        title: `Missed Recurring Payment: ${payment.name}`,
        message: `Your recurring payment for ${payment.name} (₹${payment.amount}) was due ${daysOverdue} days ago.`,
        type: 'warning' as const,
        paymentId: payment.id,
        paymentName: payment.name,
        amount: parseFloat(payment.amount),
        dueDate: payment.nextDueDate.toISOString(),
        daysOverdue,
        notificationType: 'recurring_payment_missed' as const,
        priority,
        channels: ['inApp', 'email'] as const,
      };

      const response = await fetch('/api/recurring-payments/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notification),
      });

      if (response.ok) {
        notifications.push(notification);
      }
    }

    return NextResponse.json({
      success: true,
      notificationsSent: notifications.length,
      missedPayments: missedPayments.length,
    });
  } catch (error) {
    console.error('Error processing missed payment notifications:', error);
    return NextResponse.json(
      { error: 'Failed to process missed payment notifications' },
      { status: 500 }
    );
  }
}
