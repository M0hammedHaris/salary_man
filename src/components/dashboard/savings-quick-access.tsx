"use client";

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface SavingsQuickAccessProps {
  className?: string;
  activeGoalsCount?: number;
  totalProgress?: number;
  nextMilestone?: string;
}

export function SavingsQuickAccess({
  className,
  activeGoalsCount = 0,
  totalProgress = 0,
  nextMilestone = "First Quarter"
}: SavingsQuickAccessProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Savings Goals</h3>
        {activeGoalsCount > 0 && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
            {activeGoalsCount} ACTIVE
          </span>
        )}
      </div>

      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-border p-6 shadow-sm space-y-6">
        {activeGoalsCount > 0 ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white leading-none">
                  {totalProgress.toFixed(1)}%
                </p>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">Total Progress</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-amber-500 text-[24px]">workspace_premium</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="relative h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full bg-emerald-400 transition-all duration-500"
                  style={{ width: `${Math.min(totalProgress, 100)}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <span>Start</span>
                <span className="text-emerald-500">Milestone: {nextMilestone}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-3">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Upcoming</p>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-violet-100 dark:bg-violet-500/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-violet-500 text-[18px]">event</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">{nextMilestone}</p>
                  <p className="text-[10px] font-medium text-slate-500 tracking-tight">Projected completion next month</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-slate-500">
            <span className="material-symbols-outlined text-4xl mb-2 opacity-20">target</span>
            <p className="text-sm font-medium">No savings goals yet</p>
            <p className="text-xs">Start saving for what matters</p>
          </div>
        )}

        <Link
          href="/savings"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-indigo-500 text-white text-sm font-bold hover:bg-indigo-600 transition-colors"
        >
          {activeGoalsCount > 0 ? 'Manage All Goals' : 'Create a Goal'}
          <span className="material-symbols-outlined text-[18px]">add</span>
        </Link>
      </div>
    </div>
  );
}
