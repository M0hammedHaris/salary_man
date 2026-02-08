"use client";

import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils/decimal';
import Decimal from 'decimal.js';
import { AccountDeleteDialog } from '@/components/accounts/account-delete-dialog';
import { useAccounts } from '@/lib/hooks/use-accounts';
import {
  AccountType,
  type AccountResponse,
  accountTypeLabels
} from '@/lib/types/account';

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

interface AccountListProps {
  onEditAccount?: (account: AccountResponse) => void;
  onDeleteAccount?: (account: AccountResponse) => void;
  onCreateAccount?: () => void;
  refreshTrigger?: number; // Deprecated: kept for backward compatibility
  onAccountDeleted?: () => void;
  activeFilter?: string;
}

export function AccountList({
  onEditAccount,
  onCreateAccount,
  onAccountDeleted,
  activeFilter = 'all'
}: AccountListProps) {
  // Use custom hook with TanStack Query for efficient caching
  const { data: accounts = [], isLoading, error, refetch } = useAccounts();

  const filteredAccounts = activeFilter === 'all'
    ? accounts
    : accounts.filter(account => account.type === activeFilter);

  if (isLoading) {
    return (
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-64 rounded-[40px] bg-white dark:bg-slate-900 animate-pulse border border-slate-100 dark:border-slate-800 shadow-sm" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-16 bg-white dark:bg-slate-900 rounded-[48px] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="w-20 h-20 rounded-[30px] bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center mb-8 relative z-10">
          <span className="material-symbols-outlined text-rose-500 text-4xl">warning</span>
        </div>
        <h3 className="text-3xl font-black mb-3 tracking-tight relative z-10">Something went wrong</h3>
        <p className="text-slate-500 max-w-xs text-center font-medium leading-relaxed mb-10 relative z-10">
          {error instanceof Error ? error.message : 'Failed to load accounts'}
        </p>
        <button
          onClick={() => refetch()}
          className="px-10 py-4 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-2xl font-black transition-all hover:scale-105 active:scale-95 relative z-10"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 bg-white dark:bg-slate-900 rounded-[48px] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="w-24 h-24 rounded-[36px] bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-8 relative z-10">
          <span className="material-symbols-outlined text-muted-foreground text-5xl">account_balance_wallet</span>
        </div>
        <h3 className="text-3xl font-black mb-3 tracking-tight relative z-10">No accounts found</h3>
        <p className="text-slate-500 max-w-xs text-center font-medium leading-relaxed mb-10 relative z-10">
          Connect your first bank account or credit card to see your financial world come alive.
        </p>
        {onCreateAccount && (
          <button
            onClick={onCreateAccount}
            className="px-10 py-4 bg-primary text-white rounded-2xl font-black transition-all hover:scale-105 active:scale-95 relative z-10 shadow-xl shadow-primary/20"
          >
            Create First Account
          </button>
        )}
      </div>
    );
  }

  const totalBalance = accounts.reduce((sum, account) => {
    const balanceDecimal = new Decimal(account.balance);
    if (account.type === AccountType.CREDIT_CARD) {
      return sum.minus(balanceDecimal);
    }
    return sum.plus(balanceDecimal);
  }, new Decimal(0));

  return (
    <div className="space-y-12">
      {/* Summary Header */}
      <div className="relative group overflow-hidden bg-white dark:bg-slate-900 p-10 rounded-[48px] border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] -mr-48 -mt-48 transition-transform group-hover:scale-110 duration-700" />

        <div className="flex flex-col items-center md:items-start md:flex-row md:justify-between gap-8 relative z-10">
          <div className="text-center md:text-left space-y-2">
            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Current Portfolio</p>
            <h2 className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter">
              {formatCurrency(totalBalance.toNumber())}
            </h2>
          </div>

          <div className="flex gap-4">
            <div className="flex flex-col items-center md:items-end justify-center px-6 py-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Assets</span>
              <span className="text-lg font-black text-emerald-500">
                {formatCurrency(accounts.reduce((sum, acc) => {
                  if (acc.type !== AccountType.CREDIT_CARD) {
                    return sum.plus(new Decimal(acc.balance));
                  }
                  return sum;
                }, new Decimal(0)).toNumber())}
              </span>
            </div>
            <div className="flex flex-col items-center md:items-end justify-center px-6 py-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Liabilities</span>
              <span className="text-lg font-black text-rose-500">
                {formatCurrency(accounts.reduce((sum, acc) => {
                  if (acc.type === AccountType.CREDIT_CARD) {
                    return sum.plus(new Decimal(acc.balance));
                  }
                  return sum;
                }, new Decimal(0)).toNumber())}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Accounts Grid */}
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {filteredAccounts.map((account) => {
          const colors = accountTypeColors[account.type as AccountType] || accountTypeColors[AccountType.OTHER];
          const isCreditCard = account.type === AccountType.CREDIT_CARD;
          const balanceDecimal = new Decimal(account.balance);
          const showLimit = isCreditCard && typeof account.creditLimit === 'string';
          const creditLimitDecimal = showLimit ? new Decimal(account.creditLimit as string) : new Decimal(0);
          const utilization = showLimit && creditLimitDecimal.greaterThan(0)
            ? balanceDecimal.abs().div(creditLimitDecimal).mul(100).toNumber()
            : 0;

          return (
            <div
              key={account.id}
              className="group flex flex-col p-8 rounded-[40px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-2xl transition-all cursor-default relative overflow-hidden hover:-translate-y-2 active:scale-[0.98]"
            >
              {/* Background Accent */}
              <div className={cn("absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-[0.08] group-hover:scale-150 transition-transform duration-700", colors.bg)} />

              <div className="flex items-start justify-between mb-8 relative z-10">
                <div className="space-y-1">
                  <div className={cn(
                    "inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border mb-3",
                    colors.bg, colors.text, colors.border, colors.bgDark
                  )}>
                    {accountTypeLabels[account.type as AccountType]}
                  </div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight truncate max-w-[180px]">
                    {account.name}
                  </h3>
                </div>

                <div className={cn(
                  "w-14 h-14 rounded-[22px] flex items-center justify-center shadow-sm transition-transform group-hover:rotate-12",
                  colors.bg, colors.bgDark
                )}>
                  <span className={cn("material-symbols-outlined text-[28px]", colors.icon)}>
                    {accountTypeMaterialIcons[account.type as AccountType]}
                  </span>
                </div>
              </div>

              <div className="mt-auto space-y-4 relative z-10">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1.5">
                    {isCreditCard ? 'Current Debt' : 'Available Balance'}
                  </p>
                  <p className={cn(
                    "text-3xl font-black tracking-tighter",
                    isCreditCard && balanceDecimal.greaterThan(0) ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-white"
                  )}>
                    {isCreditCard && balanceDecimal.greaterThan(0) 
                      ? `-${formatCurrency(balanceDecimal.toNumber())}` 
                      : formatCurrency(balanceDecimal.toNumber())}
                  </p>
                </div>

                {showLimit && (
                  <div className="space-y-3 pt-2">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <span>Utilization</span>
                      <span className={cn(utilization > 80 ? "text-rose-500" : "text-slate-500")}>
                        {Math.round(utilization)}%
                      </span>
                    </div>
                    <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-[2px]">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-1000 ease-out",
                          utilization > 80 ? "bg-rose-500 shadow-sm shadow-rose-200" : utilization > 50 ? "bg-amber-500 shadow-sm shadow-amber-200" : "bg-emerald-500 shadow-sm shadow-emerald-200"
                        )}
                        style={{ width: `${Math.min(utilization, 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  {onEditAccount && (
                    <button
                      onClick={() => onEditAccount(account)}
                      className="flex-1 flex items-center justify-center gap-2 h-12 rounded-[18px] bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-black text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-slate-100 dark:border-slate-800"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit_square</span>
                      Edit
                    </button>
                  )}

                  <AccountDeleteDialog
                    account={account}
                    onSuccess={() => {
                      onAccountDeleted?.();
                    }}
                  >
                    <button className="flex-1 flex items-center justify-center gap-2 h-12 rounded-[18px] bg-rose-50 dark:bg-rose-900/10 text-rose-600 dark:text-rose-400 font-black text-xs hover:bg-rose-100 dark:hover:bg-rose-900/20 transition-all border border-rose-100/50 dark:border-rose-900/20">
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                      Delete
                    </button>
                  </AccountDeleteDialog>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
