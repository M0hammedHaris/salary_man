'use client';

import { useRecurringPaymentInsights } from '@/lib/hooks/use-recurring-payments';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils/decimal';
import Link from 'next/link';

interface RecurringPaymentInsightsProps {
  userId: string;
  className?: string;
}

export function RecurringPaymentInsights({ className }: RecurringPaymentInsightsProps) {
  // Use React Query hook for cached data fetching
  const { data, isLoading, error } = useRecurringPaymentInsights();

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="h-6 w-36 bg-slate-100 dark:bg-slate-800 animate-pulse rounded" />
        <div className="h-48 rounded-3xl bg-slate-50 dark:bg-slate-900 animate-pulse" />
      </div>
    );
  }

  if (error || !data) {
    return null;
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          Recurring
        </h3>
        <Link href="/recurring-payments" className="text-sm font-medium text-primary hover:underline">
          View All
        </Link>
      </div>

      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-border p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(data.monthlyTotal)}
            </p>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">Monthly Total</p>
          </div>
          <div className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-lg font-bold text-xs",
            data.trends.direction === 'up' ? "bg-rose-50 text-rose-500" : "bg-emerald-50 text-emerald-500"
          )}>
            <span className="material-symbols-outlined text-[16px]">
              {data.trends.direction === 'up' ? 'trending_up' : 'trending_down'}
            </span>
            {data.trends.monthlyChangePercentage.toFixed(1)}%
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Budget Allocation</p>
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              {data.budgetImpact.utilizationPercentage.toFixed(0)}%
            </span>
          </div>
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full bg-indigo-400 transition-all duration-500"
              style={{ width: `${Math.min(data.budgetImpact.utilizationPercentage, 100)}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {data.topCategories.slice(0, 2).map((cat, idx) => (
            <div key={idx} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate mb-1">{cat.category}</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(cat.amount)}</p>
            </div>
          ))}
        </div>

        <div className="pt-2">
          <Link
            href="/recurring-payments/detect"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border-2 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">find_in_page</span>
            Detect Patterns
          </Link>
        </div>
      </div>
    </div>
  );
}
