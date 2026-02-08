"use client";

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface AnalyticsQuickAccessProps {
  className?: string;
}

export function AnalyticsQuickAccess({ className }: AnalyticsQuickAccessProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          Analytics
        </h3>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400">
          NEW
        </span>
      </div>

      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-border p-6 shadow-sm space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
            <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
              Monthly Growth
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-slate-900 dark:text-white">+12.5%</span>
              <span className="material-symbols-outlined text-emerald-500 text-[16px]">trending_up</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-violet-50 dark:bg-violet-500/10 border border-violet-100 dark:border-violet-500/20">
            <p className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider mb-1">
              Savings Rate
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-slate-900 dark:text-white">18.3%</span>
              <span className="material-symbols-outlined text-violet-500 text-[16px]">target</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Features Included</p>
          <ul className="space-y-2">
            {[
              { icon: 'insights', text: 'Interactive cash flow charts' },
              { icon: 'pie_chart', text: 'Spending breakdown' },
              { icon: 'show_chart', text: 'Net worth tracking' }
            ].map((item, idx) => (
              <li key={idx} className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-300">
                <span className="material-symbols-outlined text-[18px] text-slate-400">{item.icon}</span>
                {item.text}
              </li>
            ))}
          </ul>
        </div>

        <Link
          href="/analytics"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-bold hover:opacity-90 transition-opacity"
        >
          Explore Insights
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </Link>
      </div>
    </div>
  );
}
