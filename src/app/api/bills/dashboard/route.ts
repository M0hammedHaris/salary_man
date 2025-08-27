import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { BillService } from '@/lib/services/bill-service';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await getAuth(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get bill dashboard summary
    const summary = await BillService.getBillDashboardSummary(userId);

    // Get upcoming reminders
    const upcomingReminders = await BillService.getUpcomingBillsForReminders(userId, 14);

    // Get overdue bills
    const overdueBills = await BillService.getOverdueBills(userId);

    // Get insufficient funds warnings
    const insufficientFundsWarnings = await BillService.checkInsufficientFunds(userId, 7);

    return NextResponse.json({
      summary,
      upcomingReminders: upcomingReminders.slice(0, 5), // Limit to 5 for dashboard
      overdueBills: overdueBills.slice(0, 5), // Limit to 5 for dashboard
      insufficientFundsWarnings,
    });
  } catch (error) {
    console.error('Error fetching bill dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bill dashboard' },
      { status: 500 }
    );
  }
}
