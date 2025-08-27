import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';

const billReminderEmailSchema = z.object({
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  type: z.enum(['info', 'warning', 'error', 'success']),
  billId: z.string().optional(),
  billName: z.string().optional(),
  dueDate: z.string().optional(),
  amount: z.string().optional(),
  daysUntilDue: z.number().optional(),
  accountName: z.string().optional(),
  notificationType: z.enum(['bill_reminder', 'insufficient_funds', 'payment_confirmation']).optional(),
});

// POST /api/notifications/bill-reminder-email - Send bill reminder email notification
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = billReminderEmailSchema.safeParse(body);
    
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
      accountName,
      notificationType 
    } = validation.data;

    // For now, we'll log the bill reminder email notification
    // In production, integrate with email service like Resend, SendGrid, or AWS SES
    console.log('BILL REMINDER EMAIL NOTIFICATION:', {
      userId,
      title,
      message,
      type,
      billId,
      billName,
      dueDate,
      amount,
      daysUntilDue,
      accountName,
      notificationType,
      timestamp: new Date().toISOString(),
    });

    // TODO: Replace with actual email service integration
    // Example with Resend:
    /*
    import { Resend } from 'resend';
    const resend = new Resend(process.env.RESEND_API_KEY);

    const { data, error } = await resend.emails.send({
      from: 'SalaryMan <bills@salarymanapp.com>',
      to: [userEmail],
      subject: title,
      html: generateBillReminderEmailTemplate(message, type, billName, dueDate, amount, daysUntilDue),
    });

    if (error) {
      throw new Error(`Email sending failed: ${error.message}`);
    }
    */

    return NextResponse.json({
      success: true,
      message: 'Bill reminder email notification queued successfully',
      data: {
        title,
        type,
        billName,
        dueDate,
        amount,
        daysUntilDue,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('POST /api/notifications/bill-reminder-email error:', error);
    return NextResponse.json(
      { error: 'Failed to send bill reminder email notification' },
      { status: 500 }
    );
  }
}

// Helper function to generate bill reminder email template
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function generateBillReminderEmailTemplate(
  message: string,
  type: string,
  billName?: string,
  dueDate?: string,
  amount?: string,
  daysUntilDue?: number
): string {
  const bgColor = type === 'error' ? '#fee2e2' : type === 'warning' ? '#fef3c7' : '#dbeafe';
  const borderColor = type === 'error' ? '#fca5a5' : type === 'warning' ? '#fbbf24' : '#93c5fd';
  const urgencyText = daysUntilDue === 0 ? 'Due Today!' : 
                     daysUntilDue === 1 ? 'Due Tomorrow!' :
                     `Due in ${daysUntilDue} days`;
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>SalaryMan Bill Reminder</title>
      </head>
      <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f9fafb;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 24px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #1f2937; margin: 0; font-size: 24px;">📋 SalaryMan</h1>
            <p style="color: #6b7280; margin: 8px 0 0 0;">Bill Payment Reminder</p>
          </div>
          
          <div style="background-color: ${bgColor}; border-left: 4px solid ${borderColor}; padding: 16px; margin-bottom: 24px; border-radius: 4px;">
            <p style="margin: 0; color: #374151; font-size: 16px; line-height: 1.5;">
              ${message}
            </p>
          </div>
          
          ${billName ? `
            <div style="background-color: #f9fafb; padding: 16px; border-radius: 6px; margin-bottom: 24px;">
              <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 16px;">Bill Details</h3>
              <p style="margin: 0; color: #6b7280;"><strong>Bill Name:</strong> ${billName}</p>
              ${amount ? `<p style="margin: 4px 0 0 0; color: #6b7280;"><strong>Amount:</strong> ₹${amount}</p>` : ''}
              ${dueDate ? `<p style="margin: 4px 0 0 0; color: #6b7280;"><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString()}</p>` : ''}
              ${daysUntilDue !== undefined ? `
                <p style="margin: 8px 0 0 0; color: ${daysUntilDue <= 1 ? '#dc2626' : daysUntilDue <= 3 ? '#d97706' : '#059669'}; font-weight: bold; font-size: 16px;">
                  ${urgencyText}
                </p>
              ` : ''}
            </div>
          ` : ''}
          
          <div style="text-align: center; margin-top: 32px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/bills" 
               style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block; margin-right: 12px;">
              View Bills
            </a>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/bills" 
               style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
              Mark as Paid
            </a>
          </div>
          
          <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="margin: 0; color: #9ca3af; font-size: 14px;">
              You received this email because you have email notifications enabled for bill reminders.
              <br>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/profile" style="color: #3b82f6;">Update your notification preferences</a>
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}
