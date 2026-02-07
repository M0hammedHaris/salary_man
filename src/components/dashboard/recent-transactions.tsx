"use client";

import React from 'react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils/decimal';
import { format } from 'date-fns';
import { cn } from "@/lib/utils";

interface RecentTransactionsProps {
  transactions: Array<{
    id: string;
    description: string;
    amount: number;
    categoryName: string;
    categoryColor: string;
    transactionDate: Date;
    accountName: string;
  }>;
}

const getCategoryIcon = (categoryName: string) => {
  const category = categoryName.toLowerCase();
  if (category.includes('groceries') || category.includes('food') || category.includes('restaurant')) return 'restaurant';
  if (category.includes('transport') || category.includes('gas') || category.includes('car')) return 'directions_car';
  if (category.includes('shopping') || category.includes('retail')) return 'shopping_bag';
  if (category.includes('home') || category.includes('utilities')) return 'home';
  if (category.includes('entertainment') || category.includes('fun')) return 'sports_esports';
  if (category.includes('health') || category.includes('medical')) return 'medical_services';
  if (category.includes('salary') || category.includes('income') || category.includes('work')) return 'payments';
  return 'receipt_long';
};

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Transactions</h3>
        <Link href="/transactions" className="text-sm font-medium text-primary hover:underline">
          View All
        </Link>
      </div>

      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-border overflow-hidden shadow-sm">
        {transactions.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <span className="material-symbols-outlined text-4xl mb-2 opacity-20">receipt_long</span>
            <p className="text-sm">No transactions yet</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {transactions.slice(0, 5).map((transaction) => (
              <div key={transaction.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${transaction.categoryColor}15`, color: transaction.categoryColor }}>
                    <span className="material-symbols-outlined text-[24px]">
                      {getCategoryIcon(transaction.categoryName)}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[150px] sm:max-w-[200px]">
                      {transaction.description}
                    </h4>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {transaction.categoryName} • {format(new Date(transaction.transactionDate), 'MMM dd')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "text-sm font-bold",
                    transaction.amount > 0 ? "text-green-600" : "text-slate-900 dark:text-white"
                  )}>
                    {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                  </p>
                  <p className="text-xs font-medium text-slate-400">
                    {transaction.accountName}
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
