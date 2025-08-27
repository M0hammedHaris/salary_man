'use client';

import { Suspense } from 'react';
import { BreadcrumbNavigation } from '@/components/layout/breadcrumb-navigation';
import { BillCenter } from '@/components/bills/bill-center';
import { TooltipProvider } from '@/components/ui/tooltip';

export default function BillsPage() {
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <BreadcrumbNavigation className="mb-6" />
          
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Bills</h1>
              <p className="text-muted-foreground">
                Manage your bill payments and reminders
              </p>
            </div>
            
            <Suspense fallback={
              <div className="animate-pulse space-y-6">
                <div className="h-12 bg-muted rounded"></div>
                <div className="h-96 bg-muted rounded"></div>
              </div>
            }>
              <BillCenter />
            </Suspense>
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
}
