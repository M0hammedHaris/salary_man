import { NextRequest, NextResponse } from 'next/server';
import { BillService } from '@/lib/services/bill-service';

// This endpoint is called by Vercel Cron Jobs daily
export async function GET(request: NextRequest) {
  try {
    // Verify this is a cron request (in production, check authorization header)
    const authHeader = request.headers.get('authorization');
    if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting daily bill reminder processing...');
    
    // Process daily bill reminders using existing service method
    const result = await BillService.processDailyBillReminders();
    
    console.log(`Bill reminder processing completed: ${result.triggeredReminders} reminders sent, ${result.insufficientFundsWarnings.length} warnings`);

    return NextResponse.json({
      success: true,
      processedCount: result.triggeredReminders,
      totalPayments: result.processedBills,
      createdAlerts: result.createdAlerts.length,
      insufficientFundsWarnings: result.insufficientFundsWarnings.length,
      details: {
        processedBills: result.processedBills,
        triggeredReminders: result.triggeredReminders,
        insufficientFundsWarnings: result.insufficientFundsWarnings.length
      }
    });

  } catch (error) {
    console.error('Error in bill reminder cron job:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
