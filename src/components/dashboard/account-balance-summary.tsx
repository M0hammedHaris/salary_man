"use client";

import React from "react";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils/decimal';
import { cn } from "@/lib/utils";

interface AccountSummaryProps {
  accounts: Array<{
    id: string;
    name: string;
    type: string;
    balance: number;
    status: 'positive' | 'negative' | 'alert';
  }>;
}

const accountTypeGradients: Record<string, string> = {
  checking: "from-orange-100 to-orange-50 border-orange-200/50 text-orange-600 dark:from-orange-900/40 dark:to-slate-800 dark:border-orange-900/30",
  savings: "from-blue-100 to-blue-50 border-blue-200/50 text-blue-600 dark:from-blue-900/40 dark:to-slate-800 dark:border-blue-900/30",
  investment: "from-indigo-100 to-indigo-50 border-indigo-200/50 text-indigo-600 dark:from-indigo-900/40 dark:to-slate-800 dark:border-indigo-900/30",
  credit_card: "from-purple-100 to-purple-50 border-purple-200/50 text-purple-600 dark:from-purple-900/40 dark:to-slate-800 dark:border-purple-900/30",
};

const accountTypeLabelStyles: Record<string, string> = {
  checking: "text-orange-800/60 dark:text-orange-300",
  savings: "text-blue-800/60 dark:text-blue-300",
  investment: "text-indigo-800/60 dark:text-indigo-300",
  credit_card: "text-purple-800/60 dark:text-purple-300",
};

export function AccountBalanceSummary({ accounts }: AccountSummaryProps) {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 3);
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">My Accounts</h3>
        <Link href="/accounts/new" passHref>
          <button className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors">
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            Add New
          </button>
        </Link>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar snap-x">
        {accounts.map((account) => (
          <div
            key={account.id}
            className={cn(
              "min-w-[240px] snap-center rounded-2xl bg-gradient-to-br p-4 shadow-sm transition-transform hover:scale-[1.02] border",
              accountTypeGradients[account.type] || "from-slate-100 to-slate-50 border-slate-200/50 dark:from-slate-900/40 dark:to-slate-800 dark:border-slate-900/30"
            )}
          >
            <div className="flex items-center justify-between mb-8">
              <div className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs",
                account.type === 'checking' ? "bg-orange-500/20 text-orange-600" :
                  account.type === 'savings' ? "bg-blue-500/20 text-blue-600" :
                    account.type === 'investment' ? "bg-indigo-500/20 text-indigo-600" :
                      "bg-purple-500/20 text-purple-600"
              )}>
                {getInitials(account.name)}
              </div>
              <span className={cn(
                "text-xs font-semibold capitalize",
                accountTypeLabelStyles[account.type] || "text-slate-800/60 dark:text-slate-300"
              )}>
                {account.type.replace('_', ' ')}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{account.name}</p>
              <h4 className="text-2xl font-bold text-slate-900 dark:text-white">
                {formatCurrency(account.balance)}
              </h4>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
              <span>**** {Math.floor(Math.random() * 9000) + 1000}</span>
              <div className="h-1 w-1 rounded-full bg-slate-400"></div>
              <span>{account.type === 'credit_card' ? 'Visa' : 'Active'}</span>
            </div>
          </div>
        ))}

        {accounts.length === 0 && (
          <div className="min-w-[240px] h-[160px] flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-muted p-4 text-center text-muted-foreground">
            <p className="text-sm mb-2">No accounts found</p>
            <Link href="/accounts/new">
              <Button variant="outline" size="sm">Add First Account</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
