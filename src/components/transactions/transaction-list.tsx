"use client";

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { ArrowUpIcon, ArrowDownIcon, MoreHorizontal, Eye, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TransactionEditForm } from './transaction-edit-form';
import { TransactionDeleteMenuItem } from './transaction-delete-dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { type Transaction } from '@/lib/types/transaction';
import { type Account } from '@/lib/types/account';
import { type Category } from '@/lib/types/category';
import { cn } from '@/lib/utils';

interface TransactionListProps {
  accountId?: string;
  categoryId?: string;
  limit?: number;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (transaction: Transaction) => void;
  onView?: (transaction: Transaction) => void;
  className?: string;
}

interface EnrichedTransaction extends Transaction {
  account?: Account;
  category?: Category;
}

export function TransactionList({
  accountId,
  categoryId,
  limit = 50,
  onEdit,
  onDelete,
  onView,
  className
}: TransactionListProps) {
  const [transactions, setTransactions] = useState<EnrichedTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  
  // Create lookup maps for enriched data
  const [accounts, setAccounts] = useState<Record<string, Account>>({});
  const [categories, setCategories] = useState<Record<string, Category>>({});

  // Load transactions with filters
  const loadTransactions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams();
      if (accountId) params.set('accountId', accountId);
      if (categoryId) params.set('categoryId', categoryId);
      params.set('limit', limit.toString());

      // Load transactions, accounts, and categories in parallel
      const [transactionsResponse, accountsResponse, categoriesResponse] = await Promise.all([
        fetch(`/api/transactions?${params}`),
        fetch('/api/accounts'),
        fetch('/api/categories')
      ]);

      if (!transactionsResponse.ok) {
        throw new Error('Failed to load transactions');
      }

      const [transactionsData, accountsData, categoriesData] = await Promise.all([
        transactionsResponse.json(),
        accountsResponse.ok ? accountsResponse.json() : { accounts: [] },
        categoriesResponse.ok ? categoriesResponse.json() : { categories: [] }
      ]);

      // Create lookup maps for accounts and categories
      const accountsMap: Record<string, Account> = {};
      const categoriesMap: Record<string, Category> = {};

      accountsData.accounts?.forEach((account: Account) => {
        accountsMap[account.id] = account;
      });

      categoriesData.categories?.forEach((category: Category) => {
        categoriesMap[category.id] = category;
      });

      setAccounts(accountsMap);
      setCategories(categoriesMap);

      // Enrich transactions with account and category data
      const enrichedTransactions: EnrichedTransaction[] = transactionsData.transactions.map(
        (transaction: Transaction) => ({
          ...transaction,
          account: accountsMap[transaction.accountId],
          category: categoriesMap[transaction.categoryId],
        })
      );

      setTransactions(enrichedTransactions);
    } catch (error) {
      console.error('Error loading transactions:', error);
      setError(error instanceof Error ? error.message : 'Failed to load transactions');
    } finally {
      setIsLoading(false);
    }
  }, [accountId, categoryId, limit]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const handleEditSuccess = () => {
    setEditingTransaction(null);
    loadTransactions();
  };

  const handleDeleteSuccess = () => {
    loadTransactions();
  };

  const formatAmount = (amount: string): string => {
    const numAmount = parseFloat(amount);
    const formatter = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    });
    return formatter.format(Math.abs(numAmount));
  };

  const isIncome = (amount: string): boolean => {
    return parseFloat(amount) > 0;
  };

  const getTransactionIcon = (amount: string) => {
    return isIncome(amount) ? (
      <ArrowUpIcon className="h-4 w-4 text-green-600" />
    ) : (
      <ArrowDownIcon className="h-4 w-4 text-red-600" />
    );
  };

  const getAmountColor = (amount: string) => {
    return isIncome(amount) ? 'text-green-600' : 'text-red-600';
  };

  // Suppress unused parameter warnings for optional callbacks
  void onDelete;
  void accounts;
  void categories;

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>Your recent financial transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-4 w-[100px]" />
                </div>
                <Skeleton className="h-4 w-[80px] ml-auto" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>Your recent financial transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-destructive">{error}</p>
            <Button 
              variant="outline" 
              onClick={() => loadTransactions()}
              className="mt-4"
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>Your recent financial transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-muted-foreground mb-4">
              <ArrowUpIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            </div>
            <h3 className="text-lg font-medium mb-2">No transactions found</h3>
            <p className="text-muted-foreground">
              {accountId || categoryId 
                ? "No transactions match your current filters."
                : "Start by adding your first transaction to track your finances."
              }
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Transactions</span>
            <Badge variant="secondary">{transactions.length} transactions</Badge>
          </CardTitle>
          <CardDescription>Your recent financial transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id} className="cursor-pointer">
                  <TableCell className="w-[50px]">
                    {getTransactionIcon(transaction.amount)}
                  </TableCell>
                  <TableCell className="max-w-[200px]">
                    <div className="flex flex-col">
                      <span className="font-medium truncate">{transaction.description}</span>
                      {transaction.isRecurring && (
                        <Badge variant="outline" className="text-xs w-fit">
                          Recurring
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground">
                      {transaction.account?.name || 'Unknown Account'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {transaction.category && (
                        <>
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: transaction.category.color }}
                          />
                          <span className="text-sm">{transaction.category.name}</span>
                        </>
                      )}
                      {!transaction.category && (
                        <span className="text-muted-foreground text-sm">No Category</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground text-sm">
                      {format(new Date(transaction.transactionDate), 'MMM d, yyyy')}
                    </span>
                  </TableCell>
                  <TableCell className={cn("text-right font-medium", getAmountColor(transaction.amount))}>
                    {formatAmount(transaction.amount)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        {onView && (
                          <DropdownMenuItem onClick={() => onView(transaction)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => {
                          if (onEdit) {
                            onEdit(transaction);
                          } else {
                            setEditingTransaction(transaction);
                          }
                        }}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <TransactionDeleteMenuItem
                          transaction={transaction}
                          accountName={transaction.account?.name}
                          categoryName={transaction.category?.name}
                          onSuccess={handleDeleteSuccess}
                        />
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Transaction Dialog */}
      <Dialog open={!!editingTransaction} onOpenChange={(open) => !open && setEditingTransaction(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
            <DialogDescription>
              Update the details of this transaction
            </DialogDescription>
          </DialogHeader>
          {editingTransaction && (
            <TransactionEditForm
              transaction={editingTransaction}
              onSuccess={handleEditSuccess}
              onCancel={() => setEditingTransaction(null)}
              isModal={true}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
