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
import { QuickActionFloatingButton } from '@/components/dashboard/quick-action-floating-button';
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
      <div className="bg-background">
        <main className="mx-auto max-w-[1280px] px-4 py-6 sm:px-8">

          {/* Dashboard Header - Mobile First */}
          <div className="flex flex-col gap-6 lg:grid lg:grid-cols-3 lg:gap-8">

            {/* Left Column - Primary Metrics & Transactions */}
            <div className="lg:col-span-2 space-y-8">
              {/* Net Worth - Hero Component */}
              <NetWorthCard
                totalNetWorth={dashboardData.accountSummary.totalBalance}
                changePercentage={5.2}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Financial Health Score */}
                <FinancialHealthScore
                  score={dashboardData.financialHealthScore.score}
                />

                {/* Simplified Analytics Placeholder or Stats */}
                <div className="rounded-3xl bg-white dark:bg-slate-900 border border-border p-6 shadow-sm flex flex-col justify-center">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-12 w-12 rounded-2xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center text-purple-600">
                      <span className="material-symbols-outlined">trending_up</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-500">Savings Rate</p>
                      <h4 className="text-2xl font-bold">18.5%</h4>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-purple-500 h-full w-[18.5%]"></div>
                  </div>
                  <p className="mt-4 text-xs text-slate-400">↑ 2.1% from last month</p>
                </div>
              </div>

              {/* Account Balance Summary - Horizontal Cards */}
              <AccountBalanceSummary
                accounts={dashboardData.accountSummary.accounts}
              />

              {/* Recent Transactions */}
              <RecentTransactions transactions={dashboardData.recentTransactions} />
            </div>

            {/* Right Column - Secondary Metrics & Alerts */}
            <div className="space-y-4 sm:space-y-6">
              {/* Analytics Quick Access */}
              <AnalyticsQuickAccess />

              {/* Savings Goals Quick Access */}
              <SavingsQuickAccess />

              {/* Recurring Payment Insights */}
              <RecurringPaymentInsights userId={userId} />

              {/* Upcoming Bills */}
              <UpcomingBills />

              {/* Credit Card Utilization */}
              <CreditCardUtilization creditCards={dashboardData.creditCardUtilization} />

              {/* Alert Notification Panel */}
              <AlertNotificationPanel alerts={dashboardData.alerts} />
            </div>
          </div>
        </main>

        {/* Quick Action Floating Button */}
        <QuickActionFloatingButton />
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
