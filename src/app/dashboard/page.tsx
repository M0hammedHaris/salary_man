import { Suspense } from 'react';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { BreadcrumbNavigation } from '@/components/layout/breadcrumb-navigation';
import { getDashboardData } from '@/lib/services/dashboard';
import { NetWorthCard } from '@/components/dashboard/net-worth-card';
import { FinancialHealthScore } from '@/components/dashboard/financial-health-score';
import { AccountBalanceSummary } from '@/components/dashboard/account-balance-summary';
import { CreditCardUtilization } from '@/components/dashboard/credit-card-utilization';
import { RecentTransactions } from '@/components/dashboard/recent-transactions';
import { AlertNotificationPanel } from '@/components/dashboard/alert-notification-panel';
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton';
import { UpcomingBills } from '@/components/bills/upcoming-bills';
import { RecurringPaymentInsights } from '@/components/dashboard/recurring-payment-insights';
import { AnalyticsQuickAccess } from '@/components/dashboard/analytics-quick-access';
import { SavingsQuickAccess } from '@/components/dashboard/savings-quick-access';
import { TooltipProvider } from '@/components/ui/tooltip';

async function DashboardContent({ userId }: { userId: string }) {
  try {
    const dashboardData = await getDashboardData(userId);

    return (
      <div className="bg-background min-h-screen">
        <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">

          {/* Dashboard Grid - Optimized Layout */}
          <div className="space-y-6">

            {/* Top Row - Net Worth & Credit Utilization */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Net Worth Card */}
              <NetWorthCard
                totalNetWorth={dashboardData.accountSummary.totalBalance}
                changePercentage={0} // TODO: Calculate from historical data
              />

              {/* Credit Card Utilization */}
              <CreditCardUtilization creditCards={dashboardData.creditCardUtilization} />
            </div>

            {/* Second Row - Upcoming Bills & Recurring Payments */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Upcoming Bills */}
              <UpcomingBills />

              {/* Recurring Payment Insights */}
              <RecurringPaymentInsights userId={userId} />
            </div>

            {/* Account Balance Summary */}
            <AccountBalanceSummary
              accounts={dashboardData.accountSummary.accounts}
            />

            {/* Recent Transactions */}
            <RecentTransactions transactions={dashboardData.recentTransactions} />

            {/* Bottom Row - Quick Access Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Analytics Quick Access */}
              <AnalyticsQuickAccess />

              {/* Savings Goals Quick Access */}
              <SavingsQuickAccess />
            </div>

            {/* Alert Notification Panel */}
            <AlertNotificationPanel alerts={dashboardData.alerts} />
          </div>
        </main>
      </div>
    );
  } catch (error) {
    console.error('Error loading dashboard:', error);
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Unable to load dashboard
          </h2>
          <p className="text-muted-foreground">
            Please try refreshing the page or contact support if the issue persists.
          </p>
        </div>
      </div>
    );
  }
}

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <TooltipProvider>
      <Suspense fallback={
        <div className="min-h-screen bg-background">
          <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <BreadcrumbNavigation className="mb-6" />
            <DashboardSkeleton />
          </main>
        </div>
      }>
        <DashboardContent userId={userId} />
      </Suspense>
    </TooltipProvider>
  );
}
