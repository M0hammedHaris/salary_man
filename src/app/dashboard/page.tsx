import { Suspense } from 'react';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { BreadcrumbNavigation } from '@/components/layout/breadcrumb-navigation';
import { getDashboardData } from '@/lib/services/dashboard';
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
      <div className="min-h-screen bg-background">
        <main className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-8 lg:px-8">
          <BreadcrumbNavigation className="mb-4 sm:mb-6" />
          
          {/* Mobile: Single column, Desktop: 3-column grid layout */}
          <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
            
            {/* Left Column - Primary Metrics */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
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
