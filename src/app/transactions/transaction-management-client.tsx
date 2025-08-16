"use client";

import { useState, useEffect } from 'react';
import { PlusIcon, FilterIcon, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { TransactionCreateForm } from '@/components/transactions/transaction-create-form';
import { TransactionList } from '@/components/transactions/transaction-list';
import { type Account } from '@/lib/types/account';
import { type Category } from '@/lib/types/category';

interface TransactionFilters {
  accountId?: string;
  categoryId?: string;
  timeRange?: 'week' | 'month' | 'quarter' | 'year';
}

export function TransactionManagementClient() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [filters, setFilters] = useState<TransactionFilters>({});
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingFilters, setIsLoadingFilters] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Load filter data
  useEffect(() => {
    const loadFilterData = async () => {
      try {
        const [accountsResponse, categoriesResponse] = await Promise.all([
          fetch('/api/accounts'),
          fetch('/api/categories')
        ]);

        const [accountsData, categoriesData] = await Promise.all([
          accountsResponse.ok ? accountsResponse.json() : { accounts: [] },
          categoriesResponse.ok ? categoriesResponse.json() : { categories: [] }
        ]);

        setAccounts(accountsData.accounts || []);
        setCategories(categoriesData.categories || []);
      } catch (error) {
        console.error('Error loading filter data:', error);
      } finally {
        setIsLoadingFilters(false);
      }
    };

    loadFilterData();
  }, []);

  const handleCreateSuccess = () => {
    setIsCreateDialogOpen(false);
    // Force refresh of transaction list
    setRefreshKey(prev => prev + 1);
  };

  const clearFilters = () => {
    setFilters({});
  };

  const hasActiveFilters = Boolean(
    filters.accountId || filters.categoryId || filters.timeRange
  );

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <PlusIcon className="h-4 w-4" />
                Add Transaction
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Transaction</DialogTitle>
                <DialogDescription>
                  Add a new income or expense transaction to track your finances.
                </DialogDescription>
              </DialogHeader>
              <TransactionCreateForm 
                onSuccess={handleCreateSuccess} 
                onCancel={() => setIsCreateDialogOpen(false)}
                isModal={true}
              />
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            onClick={() => setRefreshKey(prev => prev + 1)}
            className="gap-2"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <FilterIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Filters:</span>
          </div>

          {/* Account Filter */}
          <Select
            value={filters.accountId || ""}
            onValueChange={(value) => 
              setFilters(prev => ({ 
                ...prev, 
                accountId: value === "all" ? undefined : value 
              }))
            }
            disabled={isLoadingFilters}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All Accounts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Accounts</SelectItem>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Category Filter */}
          <Select
            value={filters.categoryId || ""}
            onValueChange={(value) =>
              setFilters(prev => ({
                ...prev,
                categoryId: value === "all" ? undefined : value
              }))
            }
            disabled={isLoadingFilters}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: category.color }}
                    />
                    {category.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Time Range Filter */}
          <Select
            value={filters.timeRange || ""}
            onValueChange={(value) =>
              setFilters(prev => ({
                ...prev,
                timeRange: value === "all" ? undefined : (value as 'week' | 'month' | 'quarter' | 'year')
              }))
            }
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="week">Last Week</SelectItem>
              <SelectItem value="month">Last Month</SelectItem>
              <SelectItem value="quarter">Last Quarter</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant="ghost" onClick={clearFilters} className="gap-2">
              Clear Filters
              <Badge variant="secondary" className="ml-1">
                {[filters.accountId, filters.categoryId, filters.timeRange].filter(Boolean).length}
              </Badge>
            </Button>
          )}
        </div>
      </div>

      {/* Transaction Tabs */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Transactions</TabsTrigger>
          <TabsTrigger value="income">Income</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="recent">Recent</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Transactions</CardTitle>
              <CardDescription>
                Complete overview of all your financial transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TransactionList
                key={`all-${refreshKey}`}
                accountId={filters.accountId}
                categoryId={filters.categoryId}
                limit={100}
                className="border-0 shadow-none"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="income" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">Income Transactions</CardTitle>
              <CardDescription>
                Track your income sources and earnings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TransactionList
                key={`income-${refreshKey}`}
                accountId={filters.accountId}
                categoryId={filters.categoryId}
                limit={50}
                className="border-0 shadow-none"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Expense Transactions</CardTitle>
              <CardDescription>
                Monitor your spending and expense patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TransactionList
                key={`expenses-${refreshKey}`}
                accountId={filters.accountId}
                categoryId={filters.categoryId}
                limit={50}
                className="border-0 shadow-none"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>
                Your most recent financial activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TransactionList
                key={`recent-${refreshKey}`}
                accountId={filters.accountId}
                categoryId={filters.categoryId}
                limit={20}
                className="border-0 shadow-none"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
