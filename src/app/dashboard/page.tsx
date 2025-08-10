import { Suspense } from 'react';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { DashboardUserButton } from '@/components/dashboard-user-button';
import { getDashboardData } from '@/lib/services/dashboard';
import { FinancialHealthScore } from '@/components/dashboard/financial-health-score';
import { AccountBalanceSummary } from '@/components/dashboard/account-balance-summary';
import { CreditCardUtilization } from '@/components/dashboard/credit-card-utilization';
import { RecentTransactions } from '@/components/dashboard/recent-transactions';
import { AlertNotificationPanel } from '@/components/dashboard/alert-notification-panel';
import { QuickActionFloatingButton } from '@/components/dashboard/quick-action-floating-button';
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton';
import { TooltipProvider } from '@/components/ui/tooltip';

async function DashboardContent({ userId }: { userId: string }) {
  try {
    const dashboardData = await getDashboardData(userId);

    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card sticky top-0 z-40">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
              </div>
              <div className="flex items-center space-x-4">
                <DashboardUserButton />
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Mobile: Single column, Desktop: 3-column grid layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column - Primary Metrics */}
            <div className="lg:col-span-2 space-y-6">
              {/* Financial Health Score */}
              <FinancialHealthScore
                score={dashboardData.financialHealthScore.score}
                trend={dashboardData.financialHealthScore.trend}
                explanation={dashboardData.financialHealthScore.explanation}
              />

              {/* Account Balance Summary */}
              <AccountBalanceSummary
                totalBalance={dashboardData.accountSummary.totalBalance}
                checkingBalance={dashboardData.accountSummary.checkingBalance}
                savingsBalance={dashboardData.accountSummary.savingsBalance}
                creditCardBalance={dashboardData.accountSummary.creditCardBalance}
                accounts={dashboardData.accountSummary.accounts}
              />

              {/* Recent Transactions */}
              <RecentTransactions transactions={dashboardData.recentTransactions} />
            </div>

            {/* Right Column - Secondary Metrics & Alerts */}
            <div className="space-y-6">
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
          <header className="border-b bg-card sticky top-0 z-40">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex h-16 items-center justify-between">
                <div className="flex items-center">
                  <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
                </div>
                <div className="flex items-center space-x-4">
                  <DashboardUserButton />
                </div>
              </div>
            </div>
          </header>
          <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <DashboardSkeleton />
          </main>
        </div>
      }>
        <DashboardContent userId={userId} />
      </Suspense>
    </TooltipProvider>
  );
}
