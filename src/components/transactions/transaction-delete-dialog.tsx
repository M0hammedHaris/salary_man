"use client";

import { useState } from 'react';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';
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
import { Card, CardContent } from '@/components/ui/card';
import { 
  type Transaction,
  getTransactionTypeIcon,
  getTransactionTypeLabel
} from '@/lib/types/transaction';
import { format } from 'date-fns';

interface TransactionDeleteDialogProps {
  transaction: Transaction;
  accountName?: string;
  categoryName?: string;
  onSuccess?: () => void;
  children?: React.ReactNode;
  disabled?: boolean;
}

export function TransactionDeleteDialog({
  transaction,
  accountName,
  categoryName,
  onSuccess,
  children,
  disabled = false,
}: TransactionDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const isIncome = parseFloat(transaction.amount) > 0;
  const absAmount = Math.abs(parseFloat(transaction.amount));
  
  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/transactions/${transaction.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete transaction');
      }

      setIsOpen(false);
      onSuccess?.();
    } catch (err) {
      console.error('Error deleting transaction:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete transaction');
    } finally {
      setIsDeleting(false);
    }
  };

  const trigger = children || (
    <Button 
      variant="destructive" 
      size="sm"
      disabled={disabled}
      className="gap-2"
    >
      <Trash2 className="h-4 w-4" />
      Delete
    </Button>
  );

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        {trigger}
      </AlertDialogTrigger>
      <AlertDialogContent className="sm:max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Transaction
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this transaction? This action cannot be undone
            and will adjust your account balance.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Transaction Preview */}
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {getTransactionTypeIcon(transaction.amount)}
                    <span className="font-medium">
                      ${Math.abs(parseFloat(transaction.amount)).toFixed(2)}
                    </span>
                  </div>
                  <Badge variant={isIncome ? "default" : "destructive"}>
                    {getTransactionTypeLabel(transaction.amount)}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {transaction.description}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t text-sm">
              <div>
                <span className="text-muted-foreground">Date:</span>
                <p className="font-medium">
                  {format(new Date(transaction.transactionDate), 'MMM d, yyyy')}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Account:</span>
                <p className="font-medium">{accountName || 'Unknown Account'}</p>
              </div>
              {categoryName && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Category:</span>
                  <p className="font-medium">{categoryName}</p>
                </div>
              )}
            </div>

            {/* Balance Impact Warning */}
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800">Balance Impact</p>
                  <p className="text-yellow-700">
                    Your account balance will be {isIncome ? 'reduced' : 'increased'} by{' '}
                    <span className="font-medium">${absAmount.toFixed(2)}</span>
                    {isIncome 
                      ? ' (removing income)' 
                      : ' (removing expense)'
                    }
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
            {error}
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
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
                Delete Transaction
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Variant for use as a menu item in dropdown menus
interface TransactionDeleteMenuItemProps {
  transaction: Transaction;
  accountName?: string;
  categoryName?: string;
  onSuccess?: () => void;
  disabled?: boolean;
}

export function TransactionDeleteMenuItem({
  transaction,
  accountName,
  categoryName,
  onSuccess,
  disabled = false,
}: TransactionDeleteMenuItemProps) {
  return (
    <TransactionDeleteDialog
      transaction={transaction}
      accountName={accountName}
      categoryName={categoryName}
      onSuccess={onSuccess}
      disabled={disabled}
    >
      <div
        className={`
          relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none
          transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none 
          data-[disabled]:opacity-50 text-destructive hover:bg-destructive/10
          ${disabled ? 'pointer-events-none opacity-50' : ''}
        `}
        role="menuitem"
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Delete Transaction
      </div>
    </TransactionDeleteDialog>
  );
}
