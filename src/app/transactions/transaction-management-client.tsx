"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TransactionCreateForm } from '@/components/transactions/transaction-create-form';
import { TransactionList } from '@/components/transactions/transaction-list';
import { useAccounts } from '@/lib/hooks/use-accounts';
import { useCategories } from '@/lib/hooks/use-categories';
import { cn } from "@/lib/utils";

interface TransactionFilters {
  accountId?: string;
  categoryId?: string;
  timeRange?: 'week' | 'month' | 'quarter' | 'year';
}

export function TransactionManagementClient() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [filters, setFilters] = useState<TransactionFilters>({});
  const [refreshKey, setRefreshKey] = useState(0);

  // Use React Query hooks for cached data
  const { data: accounts = [], isLoading: isLoadingAccounts } = useAccounts();
  const { data: categories = [], isLoading: isLoadingCategories } = useCategories();

  const isLoadingFilters = isLoadingAccounts || isLoadingCategories;

  const handleCreateSuccess = () => {
    setIsCreateDialogOpen(false);
    setRefreshKey((prev) => prev + 1);
  };

  const clearFilters = () => {
    setFilters({});
  };

  const hasActiveFilters = useMemo(() => {
    return Object.values(filters).some(value => value !== undefined && value !== "all");
  }, [filters]);

  return (
    <div className="space-y-6">
      {/* Action Bar & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
        {/* Filters on the left */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Account Select (Redesigned) */}
          <Select
            value={filters.accountId || "all"}
            onValueChange={(value) =>
              setFilters(prev => ({
                ...prev,
                accountId: value === "all" ? undefined : value
              }))
            }
            disabled={isLoadingFilters}
          >
            <SelectTrigger className="w-[180px] h-11 rounded-xl border-slate-200 dark:border-slate-800 font-bold px-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-400 text-[18px]">account_balance_wallet</span>
                <SelectValue placeholder="Account" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-2xl p-1">
              <SelectItem value="all" className="rounded-xl font-medium">All Accounts</SelectItem>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id} className="rounded-xl font-medium">
                  {account.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Time Range Select (Redesigned) */}
          <Select
            value={filters.timeRange || "all"}
            onValueChange={(value) =>
              setFilters(prev => ({
                ...prev,
                timeRange: value === "all" ? undefined : (value as 'week' | 'month' | 'quarter' | 'year')
              }))
            }
          >
            <SelectTrigger className="w-[160px] h-11 rounded-xl border-slate-200 dark:border-slate-800 font-bold px-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-400 text-[18px]">calendar_today</span>
                <SelectValue placeholder="Time Period" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-2xl p-1">
              <SelectItem value="all" className="rounded-xl font-medium">All Time</SelectItem>
              <SelectItem value="week" className="rounded-xl font-medium">Last Week</SelectItem>
              <SelectItem value="month" className="rounded-xl font-medium">Last Month</SelectItem>
              <SelectItem value="quarter" className="rounded-xl font-medium">Last Quarter</SelectItem>
              <SelectItem value="year" className="rounded-xl font-medium">Last Year</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 h-11 px-4 text-rose-500 font-bold hover:bg-rose-50 dark:hover:bg-rose-900/10 rounded-xl transition-all"
            >
              Clear Filters
              <span className="w-5 h-5 bg-rose-500 text-white rounded-full text-[10px] flex items-center justify-center">
                {[filters.accountId, filters.categoryId, filters.timeRange].filter(Boolean).length}
              </span>
            </button>
          )}
        </div>

        {/* Action Buttons on the right */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setRefreshKey(prev => prev + 1)}
            className="flex items-center gap-2 px-5 py-3 bg-white hover:bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-foreground rounded-2xl font-bold transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-muted-foreground">refresh</span>
            Refresh
          </button>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <button className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/20">
                <span className="material-symbols-outlined">add</span>
                Add Transaction
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-4xl lg:max-w-6xl max-h-[90vh] overflow-visible border-none p-0 rounded-[32px] shadow-2xl">
              <div className="p-8">
                <DialogHeader className="mb-6">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary text-2xl">receipt_long</span>
                    </div>
                    <DialogTitle className="text-3xl font-black tracking-tight">New Transaction</DialogTitle>
                  </div>
                  <DialogDescription className="text-muted-foreground font-medium text-lg">
                    Track a new income or expense to keep your records up to date.
                  </DialogDescription>
                </DialogHeader>

                <div className="max-h-[70vh] overflow-y-auto pr-2 -mx-2 px-2 scrollbar-hide">
                  <TransactionCreateForm
                    onSuccess={handleCreateSuccess}
                    onCancel={() => setIsCreateDialogOpen(false)}
                    isModal={true}
                  />
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Transaction Content */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="inline-flex h-14 items-center justify-start rounded-3xl bg-slate-100 p-1.5 dark:bg-slate-900 gap-1 overflow-x-auto scrollbar-hide max-w-full">
          <TabsTrigger value="all" className="inline-flex items-center justify-center whitespace-nowrap rounded-2xl px-6 py-2.5 text-sm font-black ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-800 dark:text-slate-400">
            All
          </TabsTrigger>
          <TabsTrigger value="income" className="inline-flex items-center justify-center whitespace-nowrap rounded-2xl px-6 py-2.5 text-sm font-black ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-emerald-500 data-[state=active]:shadow-sm dark:data-[state=active]:bg-emerald-900/20 dark:text-slate-400">
            Income
          </TabsTrigger>
          <TabsTrigger value="expenses" className="inline-flex items-center justify-center whitespace-nowrap rounded-2xl px-6 py-2.5 text-sm font-black ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-rose-500 data-[state=active]:shadow-sm dark:data-[state=active]:bg-rose-900/20 dark:text-slate-400">
            Expenses
          </TabsTrigger>
          <TabsTrigger value="recent" className="inline-flex items-center justify-center whitespace-nowrap rounded-2xl px-6 py-2.5 text-sm font-black ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-800 dark:text-slate-400">
            Recent
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4 outline-none">
          <TransactionList
            key={`all-${refreshKey}`}
            accountId={filters.accountId}
            categoryId={filters.categoryId}
            limit={100}
            className="bg-transparent border-none shadow-none p-0"
          />
        </TabsContent>

        <TabsContent value="income" className="space-y-4 outline-none">
          <TransactionList
            key={`income-${refreshKey}`}
            type="income"
            accountId={filters.accountId}
            categoryId={filters.categoryId}
            limit={50}
            className="bg-transparent border-none shadow-none p-0"
          />
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4 outline-none">
          <TransactionList
            key={`expenses-${refreshKey}`}
            type="expense"
            accountId={filters.accountId}
            categoryId={filters.categoryId}
            limit={50}
            className="bg-transparent border-none shadow-none p-0"
          />
        </TabsContent>

        <TabsContent value="recent" className="space-y-4 outline-none">
          <TransactionList
            key={`recent-${refreshKey}`}
            accountId={filters.accountId}
            categoryId={filters.categoryId}
            limit={20}
            className="bg-transparent border-none shadow-none p-0"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
