"use client";

import { useState, useMemo } from 'react';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,

} from '@/components/ui/dialog';
import { TransactionEditForm } from './transaction-edit-form';
import { TransactionDeleteMenuItem } from './transaction-delete-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { type Transaction } from '@/lib/types/transaction';
import { type AccountResponse } from '@/lib/types/account';
import { type Category } from '@/lib/types/category';
import { cn } from '@/lib/utils';
import { useModalManager } from '@/lib/hooks/use-modal-manager';
import { useTransactions } from '@/lib/hooks/use-transactions';
import { useAccounts } from '@/lib/hooks/use-accounts';
import { useCategories } from '@/lib/hooks/use-categories';
import { useQueryClient } from '@tanstack/react-query';

interface TransactionListProps {
  accountId?: string;
  categoryId?: string;
  type?: 'income' | 'expense' | 'all';
  limit?: number;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (transaction: Transaction) => void;
  onView?: (transaction: Transaction) => void;
  className?: string;
}

interface EnrichedTransaction extends Transaction {
  account?: AccountResponse;
  category?: Category;
}

export function TransactionList({
  accountId,
  categoryId,
  type = 'all',
  limit = 50,
  onEdit,
  onView,
  className
}: TransactionListProps) {
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const queryClient = useQueryClient();

  const { restorePointerEvents } = useModalManager(!!editingTransaction);

  // Use React Query hooks for cached data fetching
  const {
    data: transactionsData,
    isLoading: isLoadingTransactions,
    error: transactionsError,
    refetch: refetchTransactions
  } = useTransactions({ accountId, categoryId, type, limit });

  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();

  // Build lookup maps for enriching transactions
  const accountsMap = useMemo(() => {
    const map: Record<string, AccountResponse> = {};
    accounts.forEach((account) => {
      map[account.id] = account;
    });
    return map;
  }, [accounts]);

  const categoriesMap = useMemo(() => {
    const map: Record<string, Category> = {};
    categories.forEach((category) => {
      map[category.id] = category;
    });
    return map;
  }, [categories]);

  // Enrich transactions with account and category data
  const transactions: EnrichedTransaction[] = useMemo(() => {
    const rawTransactions = transactionsData?.transactions || [];
    return rawTransactions.map((transaction: Transaction) => ({
      ...transaction,
      account: accountsMap[transaction.accountId],
      category: categoriesMap[transaction.categoryId],
    }));
  }, [transactionsData, accountsMap, categoriesMap]);

  const isLoading = isLoadingTransactions;
  const error = transactionsError instanceof Error ? transactionsError.message : null;

  const handleEditSuccess = () => {
    setEditingTransaction(null);
    restorePointerEvents();
    // React Query will auto-invalidate via the mutation hooks
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
  };

  const handleEditCancel = () => {
    setEditingTransaction(null);
    restorePointerEvents();
  };

  const handleDeleteSuccess = () => {
    // React Query will auto-invalidate via the mutation hooks
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
  };

  const groupedTransactions = useMemo(() => {
    const groups: Record<string, EnrichedTransaction[]> = {};

    transactions.forEach((transaction) => {
      const dateVal = transaction.transactionDate as unknown;
      let dateStr = '';

      if (dateVal instanceof Date) {
        dateStr = dateVal.toISOString().split('T')[0];
      } else if (typeof dateVal === 'string') {
        dateStr = dateVal.split('T')[0];
      }

      if (dateStr) {
        if (!groups[dateStr]) {
          groups[dateStr] = [];
        }
        groups[dateStr].push(transaction);
      }
    });

    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [transactions]);

  const formatDateLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, 'EEEE, d MMMM');
  };

  const formatAmount = (amount: string): string => {
    const numAmount = parseFloat(amount);
    const formatter = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return formatter.format(Math.abs(numAmount));
  };

  const isIncome = (amount: string): boolean => {
    return parseFloat(amount) > 0;
  };

  if (isLoading) {
    return (
      <div className={cn("space-y-10", className)}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-6">
            <Skeleton className="h-6 w-32 rounded-full bg-slate-100 dark:bg-slate-800" />
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, j) => (
                <div key={j} className="flex items-center gap-4 p-5 bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800">
                  <Skeleton className="h-14 w-14 rounded-2xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-7 w-24 rounded-lg" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-24 bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm", className)}>
        <div className="w-20 h-20 rounded-3xl bg-rose-50 text-rose-500 flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-4xl">error</span>
        </div>
        <h3 className="text-2xl font-black mb-2 tracking-tight">Something went wrong</h3>
        <p className="text-muted-foreground mb-8 font-medium text-center max-w-sm">{error}</p>
        <Button
          variant="outline"
          onClick={() => refetchTransactions()}
          className="h-12 px-8 rounded-2xl font-black uppercase tracking-widest border-2 hover:bg-slate-50 transition-all"
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-32 bg-white dark:bg-slate-900 rounded-[48px] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden", className)}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="w-24 h-24 rounded-[36px] bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-8 relative z-10">
          <span className="material-symbols-outlined text-muted-foreground text-5xl">receipt_long</span>
        </div>
        <h3 className="text-3xl font-black mb-3 tracking-tight relative z-10">No transactions yet</h3>
        <p className="text-slate-500 max-w-xs text-center font-medium leading-relaxed relative z-10">
          Your financial story begins here. Add your first transaction to start tracking.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-8", className)}>
      {groupedTransactions.map(([date, transactions]) => (
        <div key={date} className="space-y-4">
          <div className="flex items-center gap-4 px-2">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
              {formatDateLabel(date)}
            </h3>
            <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
          </div>
          <div className="grid gap-3">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="group flex items-center gap-4 p-4 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-[28px] border border-slate-100 dark:border-slate-800 transition-all cursor-pointer relative overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98]"
              >
                {/* Category Icon */}
                <div
                  className="w-12 h-12 rounded-[18px] flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${transaction.category?.color}15` }}
                >
                  <span
                    className="material-symbols-outlined text-xl"
                    style={{ color: transaction.category?.color || '#94a3b8' }}
                  >
                    {transaction.category?.icon || 'payments'}
                  </span>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h4 className="font-black text-slate-900 dark:text-white truncate text-sm">{transaction.description}</h4>
                    {transaction.isRecurring && (
                      <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[10px] text-primary font-bold">sync</span>
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 font-black uppercase tracking-wider flex items-center gap-2">
                    {transaction.account?.name}
                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                    {transaction.category?.name}
                  </p>
                </div>

                {/* Amount */}
                <div className="text-right flex flex-col items-end gap-0.5">
                  <span className={cn(
                    "text-lg font-black tracking-tight",
                    isIncome(transaction.amount) ? "text-emerald-500" : "text-slate-900 dark:text-white"
                  )}>
                    {isIncome(transaction.amount) ? "+" : "-"}{formatAmount(transaction.amount)}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider">
                      {format(new Date(transaction.transactionDate), 'hh:mm a')}
                    </span>
                    {transaction.receiptUrl && (
                      <span className="material-symbols-outlined text-[12px] text-slate-300">attach_file</span>
                    )}
                  </div>
                </div>

                {/* Dropdown Menu (only visible on hover or mobile) */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="w-10 h-10 rounded-xl hover:bg-slate-200/50">
                        <span className="material-symbols-outlined text-slate-400">more_vert</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-2xl p-1.5 border-slate-100 dark:border-slate-800 shadow-2xl min-w-[160px]">
                      <DropdownMenuLabel className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Transaction
                      </DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() => {
                          if (onEdit) onEdit(transaction);
                          else setEditingTransaction(transaction);
                        }}
                        className="rounded-xl font-bold flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-slate-50"
                      >
                        <span className="material-symbols-outlined text-[20px] text-slate-400">edit_square</span>
                        Edit
                      </DropdownMenuItem>
                      {onView && (
                        <DropdownMenuItem
                          onClick={() => onView(transaction)}
                          className="rounded-xl font-bold flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-slate-50"
                        >
                          <span className="material-symbols-outlined text-[20px] text-slate-400">visibility</span>
                          Details
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator className="my-1.5 bg-slate-50 dark:bg-slate-800" />
                      <TransactionDeleteMenuItem
                        transaction={transaction}
                        accountName={transaction.account?.name}
                        categoryName={transaction.category?.name}
                        onSuccess={handleDeleteSuccess}
                      />
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Edit Transaction Dialog */}
      <Dialog
        key={editingTransaction?.id || 'edit-dialog'}
        open={!!editingTransaction}
        onOpenChange={(open) => {
          if (!open) {
            setEditingTransaction(null);
            restorePointerEvents();
          }
        }}
        modal={true}
      >
        <DialogContent className="max-w-[95vw] sm:max-w-4xl lg:max-w-6xl max-h-[90vh] overflow-visible border-none p-0 rounded-[48px] shadow-2xl bg-transparent">
          <div className="scrollbar-hide overflow-visible">
            {editingTransaction && (
              <TransactionEditForm
                key={editingTransaction.id}
                transaction={editingTransaction}
                onSuccess={handleEditSuccess}
                onCancel={handleEditCancel}
                isModal={true}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
