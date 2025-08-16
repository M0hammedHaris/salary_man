"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AccountDeleteDialog } from '@/components/accounts/account-delete-dialog';
import { 
  AccountType, 
  type AccountResponse, 
  accountTypeLabels, 
  accountTypeIcons 
} from '@/lib/types/account';
import { Edit, Trash2, Plus, AlertTriangle } from 'lucide-react';

interface AccountListProps {
  onEditAccount?: (account: AccountResponse) => void;
  onDeleteAccount?: (account: AccountResponse) => void;
  onCreateAccount?: () => void;
  refreshTrigger?: number;
  onAccountDeleted?: () => void;
}

export function AccountList({ 
  onEditAccount, 
  onDeleteAccount, 
  onCreateAccount,
  refreshTrigger = 0,
  onAccountDeleted
}: AccountListProps) {
  const [accounts, setAccounts] = useState<AccountResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatCurrency = (amount: string): string => {
    const num = parseFloat(amount);
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(num);
  };

  const getAccountTypeVariant = (type: AccountType): "default" | "secondary" | "destructive" | "outline" => {
    switch (type) {
      case AccountType.CHECKING:
        return 'default';
      case AccountType.SAVINGS:
        return 'secondary';
      case AccountType.INVESTMENT:
        return 'outline';
      case AccountType.CREDIT_CARD:
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const fetchAccounts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/accounts');
      
      if (!response.ok) {
        throw new Error('Failed to fetch accounts');
      }
      
      const data = await response.json();
      setAccounts(data.accounts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load accounts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [refreshTrigger]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <Skeleton className="h-4 w-16" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-6 w-20" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <div>
            <h3 className="text-lg font-semibold">Error Loading Accounts</h3>
            <p className="text-muted-foreground">{error}</p>
          </div>
          <Button onClick={fetchAccounts} variant="outline">
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  if (accounts.length === 0) {
    return (
      <Card className="p-8">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="rounded-full bg-muted p-4">
            <Plus className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">No Accounts Yet</h3>
            <p className="text-muted-foreground max-w-md">
              Start by creating your first account to track your finances. You can add checking, savings, investment, or credit card accounts.
            </p>
          </div>
          {onCreateAccount && (
            <Button onClick={onCreateAccount} className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Account
            </Button>
          )}
        </div>
      </Card>
    );
  }

  const totalBalance = accounts.reduce((sum, account) => {
    if (account.type === AccountType.CREDIT_CARD) {
      // For credit cards, subtract the balance (debt)
      return sum - parseFloat(account.balance);
    }
    return sum + parseFloat(account.balance);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Your Accounts</h2>
          <p className="text-muted-foreground">
            Net Worth: <span className="font-semibold">{formatCurrency(totalBalance.toString())}</span>
          </p>
        </div>
        {onCreateAccount && (
          <Button onClick={onCreateAccount}>
            <Plus className="mr-2 h-4 w-4" />
            Add Account
          </Button>
        )}
      </div>

      {/* Accounts Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {accounts.map((account) => (
          <Card key={account.id} className="transition-all hover:shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{account.name}</CardTitle>
                <span className="text-2xl">{accountTypeIcons[account.type as AccountType]}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={getAccountTypeVariant(account.type as AccountType)}>
                  {accountTypeLabels[account.type as AccountType]}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Balance */}
                <div>
                  <p className="text-sm text-muted-foreground">
                    {account.type === AccountType.CREDIT_CARD ? 'Current Balance' : 'Balance'}
                  </p>
                  <p className={`text-xl font-semibold ${
                    account.type === AccountType.CREDIT_CARD && parseFloat(account.balance) > 0
                      ? 'text-destructive'
                      : 'text-foreground'
                  }`}>
                    {account.type === AccountType.CREDIT_CARD && parseFloat(account.balance) > 0
                      ? `-${formatCurrency(account.balance)}`
                      : formatCurrency(account.balance)
                    }
                  </p>
                </div>

                {/* Credit Limit for Credit Cards */}
                {account.type === AccountType.CREDIT_CARD && account.creditLimit && (
                  <div>
                    <p className="text-sm text-muted-foreground">Credit Limit</p>
                    <p className="text-sm font-medium">{formatCurrency(account.creditLimit)}</p>
                    <div className="mt-1">
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-destructive transition-all duration-300"
                          style={{
                            width: `${Math.min(
                              (parseFloat(account.balance) / parseFloat(account.creditLimit)) * 100, 
                              100
                            )}%`
                          }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {Math.round((parseFloat(account.balance) / parseFloat(account.creditLimit)) * 100)}% utilized
                      </p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  {onEditAccount && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditAccount(account)}
                      className="flex-1"
                    >
                      <Edit className="mr-1 h-3 w-3" />
                      Edit
                    </Button>
                  )}
                  {onDeleteAccount && (
                    <AccountDeleteDialog 
                      account={account}
                      onSuccess={() => {
                        onAccountDeleted?.();
                      }}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="mr-1 h-3 w-3" />
                        Delete
                      </Button>
                    </AccountDeleteDialog>
                  )}
                </div>

                {/* Account Meta */}
                <div className="text-xs text-muted-foreground">
                  Created {new Date(account.createdAt).toLocaleDateString()}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
