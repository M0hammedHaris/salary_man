"use client";

import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AccountCreateForm } from '@/components/accounts/account-create-form';
import { AccountEditForm } from '@/components/accounts/account-edit-form';
import { AccountList } from '@/components/accounts/account-list';
import { AccountType, type AccountResponse } from '@/lib/types/account';

type ViewMode = 'list' | 'create' | 'edit';

const filterOptions = [
  { label: 'All', value: 'all', icon: 'apps' },
  { label: 'Bank', value: AccountType.CHECKING, icon: 'payments' },
  { label: 'Savings', value: AccountType.SAVINGS, icon: 'savings' },
  { label: 'Credit', value: AccountType.CREDIT_CARD, icon: 'credit_card' },
  { label: 'Investment', value: AccountType.INVESTMENT, icon: 'monitoring' },
  { label: 'Other', value: AccountType.OTHER, icon: 'account_balance' },
];

export default function AccountsPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedAccount, setSelectedAccount] = useState<AccountResponse | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');

  const handleCreateAccount = () => {
    setIsCreateDialogOpen(true);
  };

  const handleEditAccount = (account: AccountResponse) => {
    setSelectedAccount(account);
    setIsEditDialogOpen(true);
  };

  const handleCreateSuccess = () => {
    setIsCreateDialogOpen(false);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleEditSuccess = () => {
    setIsEditDialogOpen(false);
    setSelectedAccount(null);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleCancelCreate = () => {
    setIsCreateDialogOpen(false);
  };

  const handleCancelEdit = () => {
    setIsEditDialogOpen(false);
    setSelectedAccount(null);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#f8f9fc] dark:bg-slate-950">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/5 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 relative z-10">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-2">
            <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">
              Accounts
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-semibold text-lg max-w-lg leading-relaxed">
              Manage your financial portfolio and bank connections in one premium space.
            </p>
          </div>

          <button
            onClick={handleCreateAccount}
            className="flex items-center justify-center gap-3 px-8 py-4 bg-primary text-white rounded-[24px] font-black text-lg hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/25 group hover:shadow-2xl hover:shadow-primary/30"
          >
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center group-hover:rotate-90 transition-transform">
              <span className="material-symbols-outlined font-bold">add</span>
            </div>
            Add Account
          </button>
        </div>

        {/* Horizontal Filters */}
        <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          {filterOptions.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setActiveFilter(filter.value)}
              className={cn(
                "flex items-center gap-2.5 px-6 py-3.5 rounded-[22px] font-black text-sm whitespace-nowrap transition-all shrink-0 border-2",
                activeFilter === filter.value
                  ? "bg-white dark:bg-slate-900 border-primary text-primary shadow-lg shadow-primary/10 scale-105"
                  : "bg-white/50 dark:bg-slate-900/50 border-transparent text-slate-500 hover:bg-white dark:hover:bg-slate-900 hover:border-slate-200 dark:hover:border-slate-800"
              )}
            >
              <span className={cn(
                "material-symbols-outlined text-[20px]",
                activeFilter === filter.value ? "text-primary" : "text-slate-400"
              )}>
                {filter.icon}
              </span>
              {filter.label}
            </button>
          ))}
        </div>

        {/* Main Content */}
        <main className="pb-24">
          <AccountList
            onEditAccount={handleEditAccount}
            onCreateAccount={handleCreateAccount}
            refreshTrigger={refreshTrigger}
            onAccountDeleted={() => setRefreshTrigger(prev => prev + 1)}
            activeFilter={activeFilter}
          />
        </main>

        {/* Create Account Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-visible border-none p-0 rounded-[48px] shadow-2xl bg-transparent">
            <div className="scrollbar-hide overflow-visible">
              <AccountCreateForm
                onSuccess={handleCreateSuccess}
                onCancel={handleCancelCreate}
                isModal={true}
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Account Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-visible border-none p-0 rounded-[48px] shadow-2xl bg-transparent">
            <div className="scrollbar-hide overflow-visible">
              {selectedAccount && (
                <AccountEditForm
                  account={selectedAccount}
                  onSuccess={handleEditSuccess}
                  onCancel={handleCancelEdit}
                  isModal={true}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
