import { Suspense } from 'react';
import { Metadata } from 'next';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { AnalyticsDashboard } from '@/components/analytics/analytics-dashboard';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { AnalyticsErrorFallback } from '@/components/analytics/analytics-error-fallback';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata: Metadata = {
  title: 'Analytics - SalaryMan',
  description: 'Comprehensive financial analytics and insights to track your financial patterns and make data-driven decisions.',
};

function AnalyticsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      
      {/* Date Range Selector Skeleton */}
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-32" />
      </div>
      
      {/* Dashboard Grid Skeleton */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-16" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Charts Skeleton */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default async function AnalyticsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Comprehensive financial analytics and insights to track your patterns and make data-driven decisions
        </p>
      </div>

      <ErrorBoundary fallback={<AnalyticsErrorFallback />}>
        <Suspense fallback={<AnalyticsLoadingSkeleton />}>
          <AnalyticsDashboard />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
