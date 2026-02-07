import { getSavingsGoals } from '@/lib/actions/savings-goals';
import { SavingsPageClient } from './savings-page-client';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

function SavingsLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <Skeleton className="h-9 w-96 mb-2" />
            <Skeleton className="h-6 w-[600px]" />
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <Skeleton className="h-8 w-48" />
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-64" />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

async function SavingsContent() {
  const data = await getSavingsGoals();

  return (
    <SavingsPageClient initialGoals={data.goals} />
  );
}

export default function SavingsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
              Savings Goals & Financial Planning
            </h1>
            <p className="text-muted-foreground text-lg">
              Track your progress, achieve milestones, and optimize your savings strategy
            </p>
          </div>

          <Suspense fallback={<SavingsLoading />}>
            <SavingsContent />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
