import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

interface TestNotificationRequest {
  type: string;
  channel: 'in-app' | 'email' | 'push';
  message?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: TestNotificationRequest = await request.json();
    const { type, channel, message } = body;

    // Validate required fields
    if (!type || !channel) {
      return NextResponse.json(
        { error: 'Missing required fields: type and channel' },
        { status: 400 }
      );
    }

    // Validate channel
    if (!['in-app', 'email', 'push'].includes(channel)) {
      return NextResponse.json(
        { error: 'Invalid channel. Must be one of: in-app, email, push' },
        { status: 400 }
      );
    }

    // Generate test notification content based on type
    const testContent = generateTestContent(type, message);

    // Simulate sending notification based on channel
    const result = await sendTestNotification(userId, channel, testContent);

    return NextResponse.json({
      message: 'Test notification sent successfully',
      details: result.details,
      channel,
      type,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error sending test notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateTestContent(type: string, customMessage?: string) {
  if (customMessage) {
    return {
      title: `Test ${type.replace('_', ' ')} Alert`,
      message: customMessage
    };
  }

  const testMessages: Record<string, { title: string; message: string }> = {
    low_balance: {
      title: 'Low Balance Alert - Test',
      message: 'This is a test low balance notification. Your account balance has fallen below $100.'
    },
    bill_due: {
      title: 'Bill Due Reminder - Test',
      message: 'This is a test bill reminder. Your electricity bill of $85.00 is due in 3 days.'
    },
    transaction_alert: {
      title: 'Transaction Alert - Test',
      message: 'This is a test transaction alert. A charge of $25.99 was made at Coffee Shop.'
    },
    payment_confirmation: {
      title: 'Payment Confirmation - Test',
      message: 'This is a test payment confirmation. Your rent payment of $1200.00 has been processed.'
    },
    fraud_alert: {
      title: 'Fraud Alert - Test',
      message: 'This is a test fraud alert. Unusual activity detected on your account. Please review immediately.'
    },
    budget_exceeded: {
      title: 'Budget Exceeded - Test',
      message: 'This is a test budget alert. You have exceeded your dining budget by $45.30 this month.'
    },
    recurring_payment: {
      title: 'Recurring Payment - Test',
      message: 'This is a test recurring payment notification. Your Netflix subscription of $15.99 has been processed.'
    }
  };

  return testMessages[type] || {
    title: 'Test Notification',
    message: 'This is a generic test notification.'
  };
}

async function sendTestNotification(
  userId: string, 
  channel: string, 
  _content: { title: string; message: string }
) {
  // Simulate different delivery mechanisms
  switch (channel) {
    case 'in-app':
      // For in-app notifications, we could insert into the alerts table
      // For now, just simulate success
      return {
        success: true,
        details: 'Test in-app notification would be displayed in notification center'
      };

    case 'email':
      // For email, we would integrate with email service (SendGrid, etc.)
      // For now, simulate based on environment
      if (process.env.NODE_ENV === 'production') {
        return {
          success: false,
          details: 'Email testing not configured in production environment'
        };
      } else {
        return {
          success: true,
          details: 'Test email would be sent to user email address'
        };
      }

    case 'push':
      // For push notifications, we would integrate with push service
      // For now, simulate success in development
      if (process.env.NODE_ENV === 'production') {
        return {
          success: false,
          details: 'Push notification testing not configured in production environment'
        };
      } else {
        return {
          success: true,
          details: 'Test push notification would be sent to registered devices'
        };
      }

    default:
      return {
        success: false,
        details: 'Unknown delivery channel'
      };
  }
}
