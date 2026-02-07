"use client";

import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils/decimal';

interface CreditCardUtilizationProps {
  creditCards: Array<{
    accountId: string;
    accountName: string;
    utilization: number;
    balance: number;
    creditLimit: number;
    status: 'good' | 'warning' | 'danger';
  }>;
}

export function CreditCardUtilization({ creditCards }: CreditCardUtilizationProps) {
  const averageUtilization = creditCards.length > 0
    ? Math.round(creditCards.reduce((sum, card) => sum + card.utilization, 0) / creditCards.length)
    : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-500 bg-green-50 dark:bg-green-500/10';
      case 'warning': return 'text-amber-500 bg-amber-50 dark:bg-amber-500/10';
      case 'danger': return 'text-rose-500 bg-rose-50 dark:bg-rose-500/10';
      default: return 'text-slate-500 bg-slate-50 dark:bg-slate-500/10';
    }
  };

  const getProgressColor = (utilization: number) => {
    if (utilization < 30) return 'bg-green-400';
    if (utilization < 70) return 'bg-amber-400';
    return 'bg-rose-400';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          Credit Utilization
        </h3>
        <span className={cn(
          "text-xs font-bold px-2 py-1 rounded-lg",
          getStatusColor(averageUtilization < 30 ? 'good' : averageUtilization < 70 ? 'warning' : 'danger')
        )}>
          {averageUtilization}% Avg
        </span>
      </div>

      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-border p-6 shadow-sm space-y-6">
        {creditCards.length === 0 ? (
          <div className="text-center py-6 text-slate-500">
            <span className="material-symbols-outlined text-4xl mb-2 opacity-20">credit_card</span>
            <p className="text-sm font-medium">No credit cards tracked</p>
          </div>
        ) : (
          <div className="space-y-6">
            {creditCards.map((card) => (
              <div key={card.accountId} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-indigo-500 text-[20px]">credit_card</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{card.accountName}</h4>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        Limit: {formatCurrency(card.creditLimit)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {card.utilization}%
                    </p>
                    <p className="text-xs font-medium text-slate-500">
                      {formatCurrency(Math.abs(card.balance))}
                    </p>
                  </div>
                </div>

                <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className={cn("h-full transition-all duration-500", getProgressColor(card.utilization))}
                    style={{ width: `${Math.min(card.utilization, 100)}%` }}
                  />
                </div>
              </div>
            ))}

            <div className="pt-4 border-t border-border mt-2">
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-sky-50 dark:bg-sky-500/10 border border-sky-100 dark:border-sky-500/20">
                <span className="material-symbols-outlined text-sky-500 text-[20px]">info</span>
                <p className="text-xs font-medium text-sky-700 dark:text-sky-300 leading-relaxed">
                  Keeping utilization below 30% helps improve your credit score. Try to pay off balances before the statement date.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
