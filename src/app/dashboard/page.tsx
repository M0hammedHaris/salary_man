import { Suspense } from 'react';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { BreadcrumbNavigation } from '@/components/layout/breadcrumb-navigation';
import { getDashboardData } from '@/lib/services/dashboard';
import { EnhancedDashboard } from '@/components/dashboard/enhanced-dashboard';
import { TooltipProvider } from '@/components/ui/tooltip';

async function DashboardContent({ userId }: { userId: string }) {
  try {
    const dashboardData = await getDashboardData(userId);

    return (
      <div className="min-h-screen bg-background">
        <main className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-8 lg:px-8">
          <BreadcrumbNavigation className="mb-4 sm:mb-6" />
          
          {/* Enhanced Dashboard with Bento Grid Layout */}
          <EnhancedDashboard 
            dashboardData={dashboardData}
            loading={false}
            className="space-y-6"
          />
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
            <EnhancedDashboard 
              dashboardData={undefined}
              loading={true}
              className="space-y-6"
            />
          </main>
        </div>
      }>
        <DashboardContent userId={userId} />
      </Suspense>
    </TooltipProvider>
  );
}
