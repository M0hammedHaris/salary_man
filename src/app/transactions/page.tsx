import { Suspense } from 'react';
import { Metadata } from 'next';
import { BreadcrumbNavigation } from '@/components/layout/breadcrumb-navigation';
import { TransactionManagementClient } from './transaction-management-client';
import { TransactionPageSkeleton } from './transaction-page-skeleton';

export const metadata: Metadata = {
  title: 'Transaction Management - Salary Man',
  description: 'Manage your financial transactions, track income and expenses, and analyze your spending patterns.',
  keywords: ['transactions', 'income', 'expenses', 'financial tracking', 'money management']
};

export default function TransactionsPage() {
  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black text-foreground tracking-tight">Transactions</h1>
            <p className="text-muted-foreground font-medium">Track and manage your financial activity across all accounts.</p>
          </div>
        </div>

        <Suspense fallback={<TransactionPageSkeleton />}>
          <TransactionManagementClient />
        </Suspense>
      </div>
    </div>
  );
}
