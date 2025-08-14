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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  type AccountResponse, 
  AccountType, 
  accountTypeLabels, 
  accountTypeIcons 
} from '@/lib/types/account';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';

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

  const formatCurrency = (amount: string): string => {
    const num = parseFloat(amount);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(num);
  };

  const checkTransactionDependency = async () => {
    setCheckingTransactions(true);
    try {
      // For now, we'll simulate checking transactions
      // In a real app, this would be an API call to check if the account has transactions
      const response = await fetch(`/api/accounts/${account.id}/transactions`);
      if (response.ok) {
        const data = await response.json();
        setHasTransactions(data.hasTransactions || false);
      } else {
        // If the endpoint doesn't exist, assume no transactions for now
        setHasTransactions(false);
      }
    } catch (error) {
      console.error('Error checking transactions:', error);
      // Assume no transactions if we can't check
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

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
            <Trash2 className="mr-1 h-3 w-3" />
            Delete
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent className="sm:max-w-[500px]">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Account
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>
                You are about to permanently delete the following account:
              </p>
              
              {/* Account Details */}
              <div className="p-4 bg-muted rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-foreground">{account.name}</h4>
                  <span className="text-2xl">{accountTypeIcons[account.type as AccountType]}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {accountTypeLabels[account.type as AccountType]}
                  </Badge>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Current Balance</p>
                  <p className="text-lg font-semibold text-foreground">
                    {formatCurrency(account.balance)}
                  </p>
                </div>
                
                {account.creditLimit && (
                  <div>
                    <p className="text-sm text-muted-foreground">Credit Limit</p>
                    <p className="text-sm font-medium text-foreground">
                      {formatCurrency(account.creditLimit)}
                    </p>
                  </div>
                )}
              </div>

              {/* Transaction Dependency Check */}
              {checkingTransactions && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 text-blue-700 rounded-lg">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Checking for associated transactions...</span>
                </div>
              )}
              
              {hasTransactions === true && (
                <div className="p-3 bg-destructive/10 text-destructive rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium">Cannot delete this account</p>
                      <p className="mt-1">
                        This account has transaction history and cannot be deleted. 
                        Consider deactivating it instead to preserve your financial records.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {hasTransactions === false && (
                <div className="space-y-2">
                  <div className="p-3 bg-yellow-50 text-yellow-700 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium">This action cannot be undone</p>
                        <p className="mt-1">
                          The account and all associated data will be permanently removed 
                          from your records.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            Cancel
          </AlertDialogCancel>
          
          {hasTransactions === true ? (
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Keep Account
            </Button>
          ) : (
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting || checkingTransactions || hasTransactions === null}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Account
                </>
              )}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
