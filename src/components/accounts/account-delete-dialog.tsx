"use client";

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import {
  type AccountResponse,
  AccountType,
  accountTypeLabels
} from '@/lib/types/account';
import { formatCurrency } from '@/lib/utils/decimal';

const accountTypeMaterialIcons: Record<AccountType, string> = {
  [AccountType.CHECKING]: 'payments',
  [AccountType.SAVINGS]: 'savings',
  [AccountType.INVESTMENT]: 'monitoring',
  [AccountType.CREDIT_CARD]: 'credit_card',
  [AccountType.OTHER]: 'account_balance'
};

const accountTypeColors: Record<AccountType, { bg: string, text: string, icon: string, border: string, bgDark: string }> = {
  [AccountType.CHECKING]: { bg: 'bg-blue-50', text: 'text-blue-700', icon: 'text-blue-500', border: 'border-blue-100', bgDark: 'dark:bg-blue-900/20' },
  [AccountType.SAVINGS]: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: 'text-emerald-500', border: 'border-emerald-100', bgDark: 'dark:bg-emerald-900/20' },
  [AccountType.INVESTMENT]: { bg: 'bg-purple-50', text: 'text-purple-700', icon: 'text-purple-500', border: 'border-purple-100', bgDark: 'dark:bg-purple-900/20' },
  [AccountType.CREDIT_CARD]: { bg: 'bg-rose-50', text: 'text-rose-700', icon: 'text-rose-500', border: 'border-rose-100', bgDark: 'dark:bg-rose-900/20' },
  [AccountType.OTHER]: { bg: 'bg-amber-50', text: 'text-amber-700', icon: 'text-amber-500', border: 'border-amber-100', bgDark: 'dark:bg-amber-900/20' },
};

interface AccountDeleteDialogProps {
  account: AccountResponse;
  onSuccess?: () => void;
  children?: React.ReactNode;
}

export function AccountDeleteDialog({ account, onSuccess, children }: AccountDeleteDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasTransactions, setHasTransactions] = useState<boolean | null>(null);
  const [checkingTransactions, setCheckingTransactions] = useState(false);

  const checkTransactionDependency = async () => {
    setCheckingTransactions(true);
    try {
      const response = await fetch(`/api/accounts/${account.id}/transactions`);
      if (response.ok) {
        const data = await response.json();
        setHasTransactions(data.hasTransactions || false);
      } else {
        setHasTransactions(false);
      }
    } catch (error) {
      console.error('Error checking transactions:', error);
      setHasTransactions(false);
    } finally {
      setCheckingTransactions(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/accounts/${account.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete account');
      }

      setIsOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error deleting account:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete account');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open && hasTransactions === null) {
      checkTransactionDependency();
    }
  };

  const colors = accountTypeColors[account.type as AccountType] || accountTypeColors[AccountType.OTHER];
  const balanceNum = parseFloat(account.balance);

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        {children || (
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-rose-500 font-bold hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-all text-sm">
            <span className="material-symbols-outlined text-[18px]">delete</span>
            Delete
          </button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-none rounded-[32px] shadow-2xl">
        <div className="p-8 space-y-6">
          <AlertDialogHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-rose-500 text-2xl">warning</span>
              </div>
              <AlertDialogTitle className="text-2xl font-black tracking-tight">Delete Account</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-muted-foreground font-medium text-base">
              You are about to permanently delete this account. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className={cn(
                  "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-1 border w-fit",
                  colors.bg, colors.text, colors.border, colors.bgDark
                )}>
                  {accountTypeLabels[account.type as AccountType]}
                </span>
                <span className="text-lg font-bold text-foreground leading-tight">{account.name}</span>
              </div>
              <div className={cn(
                "w-10 h-10 rounded-2xl flex items-center justify-center",
                colors.bg, colors.bgDark
              )}>
                <span className={cn("material-symbols-outlined text-[20px]", colors.icon)}>
                  {accountTypeMaterialIcons[account.type as AccountType]}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200/50 dark:border-slate-800/50">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Current Balance</p>
              <p className="text-xl font-black text-foreground">{formatCurrency(balanceNum)}</p>
            </div>
          </div>

          {checkingTransactions && (
            <div className="flex items-center gap-3 p-4 bg-primary/5 text-primary rounded-2xl animate-pulse">
              <span className="material-symbols-outlined animate-spin">refresh</span>
              <span className="text-sm font-bold">Checking account history...</span>
            </div>
          )}

          {hasTransactions === true && (
            <div className="p-4 bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400 rounded-2xl border border-amber-100 dark:border-amber-900/20">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-[20px] mt-0.5">info</span>
                <div className="text-sm">
                  <p className="font-black mb-1">History Detected</p>
                  <p className="font-medium opacity-90">
                    This account has recorded transactions. Deleting it will also remove all associated history.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <AlertDialogFooter className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 gap-3 sm:gap-4 flex-col sm:flex-row">
          <AlertDialogCancel className="h-12 border-none bg-white dark:bg-slate-800 text-foreground font-bold rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all flex-1 m-0">
            Keep Account
          </AlertDialogCancel>

          {hasTransactions === true ? (
            <AlertDialogCancel className="h-12 border-none bg-primary text-white font-bold rounded-2xl hover:opacity-90 transition-all flex-1 m-0 shadow-lg shadow-primary/20">
              Go Back
            </AlertDialogCancel>
          ) : (
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting || checkingTransactions || hasTransactions === null}
              className="h-12 bg-rose-500 text-white font-bold rounded-2xl hover:bg-rose-600 active:scale-[0.98] transition-all flex-1 m-0 shadow-lg shadow-rose-500/20 border-none"
            >
              {isDeleting ? (
                <span className="material-symbols-outlined animate-spin">refresh</span>
              ) : (
                "Yes, Delete"
              )}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
