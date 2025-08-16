import { Suspense } from 'react';
import { Metadata } from 'next';
import { BreadcrumbNavigation } from '@/components/layout/breadcrumb-navigation';
import { TransactionManagementClient } from './transaction-management-client';
import { TransactionPageSkeleton } from './transaction-page-skeleton';

export const metadata: Metadata = {
  title: 'Transaction Management - Salary Man',
  description: 'Manage your financial transactions, track income and expenses, and analyze your spending patterns.',
  keywords: ['transactions', 'income', 'expenses', 'financial tracking', 'money management'],
};

export default function TransactionsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <BreadcrumbNavigation className="mb-6" />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transaction Management</h1>
          <p className="text-muted-foreground">
            Track your income and expenses, categorize transactions, and monitor your financial health.
          </p>
        </div>
      </div>

      <Suspense fallback={<TransactionPageSkeleton />}>
        <TransactionManagementClient />
      </Suspense>
    </div>
  );
}
