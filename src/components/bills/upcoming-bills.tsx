'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getUserBills } from '@/lib/actions/bills';
import { format, isToday, isTomorrow, addDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils/decimal';
import Link from 'next/link';

interface Bill {
  id: string;
  name: string;
  amount: string;
  nextDueDate: string | Date;
  reminderDays: string;
  account: {
    id: string;
    name: string;
    type: string;
  };
  category?: {
    id: string;
    name: string;
    color?: string;
  } | null;
}

interface UpcomingBillsProps {
  onPayBill?: (billId: string) => void;
  onSetupReminder?: (billId: string) => void;
  className?: string;
}

export function UpcomingBills({ onPayBill: _onPayBill, onSetupReminder: _onSetupReminder, className }: UpcomingBillsProps) {
  const [timeFilter] = useState<'today' | 'week' | 'month'>('week');

  const { data: billsResponse, isLoading, error } = useQuery({
    queryKey: ['bills', 'upcoming', timeFilter],
    queryFn: async () => {
      const response = await getUserBills();
      return response;
    },
    refetchInterval: 60 * 60 * 1000,
  });

  const bills = billsResponse?.bills || [];

  const filterBillsByTime = (bills: Bill[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = timeFilter === 'today' ? addDays(today, 1) :
      timeFilter === 'week' ? addDays(today, 7) :
        addDays(today, 30);

    return bills.filter(bill => {
      const dueDate = new Date(bill.nextDueDate);
      return dueDate >= today && dueDate <= endDate;
    });
  };

  const getUrgencyStyles = (nextDueDate: string | Date) => {
    const due = new Date(nextDueDate);
    if (isToday(due)) return 'text-rose-500 bg-rose-50 dark:bg-rose-500/10';
    if (isTomorrow(due)) return 'text-amber-500 bg-amber-50 dark:bg-amber-500/10';
    return 'text-slate-500 bg-slate-50 dark:bg-slate-500/10';
  };

  const getUrgencyText = (nextDueDate: string | Date) => {
    const due = new Date(nextDueDate);
    if (isToday(due)) return 'Today';
    if (isTomorrow(due)) return 'Tomorrow';
    return format(due, 'MMM dd');
  };

  const upcomingBills = filterBillsByTime(bills).sort((a, b) =>
    new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime()
  ).slice(0, 3);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Upcoming Bills</h3>
        <Link href="/bills" className="text-sm font-medium text-primary hover:underline">
          View All
        </Link>
      </div>

      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-border overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-4 items-center">
                <div className="h-10 w-10 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 bg-slate-100 dark:bg-slate-800 animate-pulse rounded" />
                  <div className="h-3 w-16 bg-slate-100 dark:bg-slate-800 animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-500">
            <span className="material-symbols-outlined text-4xl mb-2">error</span>
            <p className="text-sm font-medium">Failed to load bills</p>
          </div>
        ) : upcomingBills.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <span className="material-symbols-outlined text-4xl mb-2 opacity-20">event_busy</span>
            <p className="text-sm font-medium">No upcoming bills</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {upcomingBills.map((bill) => (
              <div key={bill.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl flex items-center justify-center bg-violet-50 dark:bg-violet-500/10 text-violet-500">
                    <span className="material-symbols-outlined text-[24px]">payments</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[120px]">
                      {bill.name}
                    </h4>
                    <span className={cn(
                      "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold mt-1",
                      getUrgencyStyles(bill.nextDueDate)
                    )}>
                      {getUrgencyText(bill.nextDueDate)}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {formatCurrency(Number(bill.amount))}
                  </p>
                  <p className="text-xs font-medium text-slate-400">
                    {bill.account.name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
