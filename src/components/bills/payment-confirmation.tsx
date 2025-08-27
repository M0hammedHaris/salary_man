'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CheckCircle, CreditCard, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface Bill {
  id: string;
  name: string;
  amount: string;
  nextDueDate: string;
  category?: {
    id: string;
    name: string;
  };
  account: {
    id: string;
    name: string;
    type: string;
  };
}

const paymentConfirmationSchema = z.object({
  paidAmount: z.string()
    .min(1, 'Amount is required')
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, 'Must be a valid positive amount'),
  paidDate: z.string().min(1, 'Payment date is required'),
  paymentMethod: z.string().min(1, 'Payment method is required'),
  transactionReference: z.string().optional(),
  notes: z.string().optional(),
});

type PaymentConfirmationData = z.infer<typeof paymentConfirmationSchema>;

interface PaymentConfirmationProps {
  billId: string;
  bill: Bill | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function PaymentConfirmation({ billId, bill, open, onClose, onSuccess }: PaymentConfirmationProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<PaymentConfirmationData>({
    resolver: zodResolver(paymentConfirmationSchema),
    defaultValues: {
      paidAmount: bill?.amount || '',
      paidDate: format(new Date(), 'yyyy-MM-dd'),
      paymentMethod: '',
      transactionReference: '',
      notes: '',
    },
  });

  // Reset form when bill changes
  useState(() => {
    if (bill) {
      form.reset({
        paidAmount: bill.amount,
        paidDate: format(new Date(), 'yyyy-MM-dd'),
        paymentMethod: '',
        transactionReference: '',
        notes: '',
      });
    }
  });

  const onSubmit = async (data: PaymentConfirmationData) => {
    setIsLoading(true);

    try {
      // Create transaction record for the payment
      const transactionResponse = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountId: bill?.account.id,
          categoryId: bill?.category?.id,
          amount: -Math.abs(Number(data.paidAmount)), // Negative for payment
          description: `Bill Payment: ${bill?.name}`,
          date: data.paidDate,
          type: 'expense',
          billId: billId,
          paymentMethod: data.paymentMethod,
          transactionReference: data.transactionReference,
          notes: data.notes,
        }),
      });

      if (!transactionResponse.ok) {
        const error = await transactionResponse.json();
        throw new Error(error.message || 'Failed to record payment');
      }

      // Update bill status to paid (if implementing bill status tracking)
      const billResponse = await fetch(`/api/bills/${billId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lastPaidDate: data.paidDate,
          lastPaidAmount: data.paidAmount,
        }),
      });

      if (!billResponse.ok) {
        console.warn('Failed to update bill payment status');
      }

      setIsSuccess(true);

      // Auto-close after success
      setTimeout(() => {
        setIsSuccess(false);
        onSuccess();
      }, 2000);

    } catch (error) {
      console.error('Error recording payment:', error);
      // You might want to show a toast or error message here
    } finally {
      setIsLoading(false);
    }
  };

  const paidAmount = form.watch('paidAmount');
  const billAmount = Number(bill?.amount || 0);
  const paidAmountNum = Number(paidAmount || 0);
  const amountDifference = paidAmountNum - billAmount;

  if (isSuccess) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[400px]">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Payment Recorded!</h3>
            <p className="text-muted-foreground">
              Your payment for {bill?.name} has been successfully recorded.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          {bill && (
            <p className="text-sm text-muted-foreground">
              Record payment for {bill.name}
            </p>
          )}
        </DialogHeader>

        {bill && (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Bill Information */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{bill.name}</CardTitle>
                    <CardDescription className="mt-1">
                      Due: {format(new Date(bill.nextDueDate), 'MMM dd, yyyy')}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="ml-2">
                    {bill.category?.name || 'Uncategorized'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Account:</span>
                  <span className="font-medium">{bill.account.name}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-muted-foreground">Bill Amount:</span>
                  <span className="font-medium">₹{Number(bill.amount).toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Payment Details */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Paid Amount */}
                <div className="space-y-2">
                  <Label htmlFor="paidAmount">Paid Amount</Label>
                  <Input
                    id="paidAmount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...form.register('paidAmount')}
                  />
                  {form.formState.errors.paidAmount && (
                    <p className="text-sm text-destructive">{form.formState.errors.paidAmount.message}</p>
                  )}
                  
                  {/* Amount difference indicator */}
                  {paidAmountNum > 0 && amountDifference !== 0 && (
                    <p className={`text-xs ${amountDifference > 0 ? 'text-orange-500' : 'text-green-500'}`}>
                      {amountDifference > 0 
                        ? `₹${amountDifference.toFixed(2)} over bill amount`
                        : `₹${Math.abs(amountDifference).toFixed(2)} under bill amount`}
                    </p>
                  )}
                </div>

                {/* Payment Date */}
                <div className="space-y-2">
                  <Label htmlFor="paidDate">Payment Date</Label>
                  <Input
                    id="paidDate"
                    type="date"
                    {...form.register('paidDate')}
                  />
                  {form.formState.errors.paidDate && (
                    <p className="text-sm text-destructive">{form.formState.errors.paidDate.message}</p>
                  )}
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Input
                  id="paymentMethod"
                  placeholder="e.g., Online Banking, Credit Card, Cash, Check"
                  {...form.register('paymentMethod')}
                />
                {form.formState.errors.paymentMethod && (
                  <p className="text-sm text-destructive">{form.formState.errors.paymentMethod.message}</p>
                )}
              </div>

              {/* Transaction Reference */}
              <div className="space-y-2">
                <Label htmlFor="transactionReference">Transaction Reference (Optional)</Label>
                <Input
                  id="transactionReference"
                  placeholder="e.g., Transaction ID, Check number"
                  {...form.register('transactionReference')}
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes about this payment..."
                  rows={3}
                  {...form.register('notes')}
                />
              </div>
            </div>

            {/* Payment Summary */}
            <Card className="bg-muted/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Payment Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Bill Amount:</span>
                  <span>₹{Number(bill.amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Paid Amount:</span>
                  <span className="font-medium">₹{Number(paidAmount || 0).toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm font-medium">
                  <span>Status:</span>
                  <span className={
                    amountDifference === 0 ? 'text-green-600' :
                    amountDifference > 0 ? 'text-orange-600' : 'text-yellow-600'
                  }>
                    {amountDifference === 0 ? 'Fully Paid' :
                     amountDifference > 0 ? 'Overpaid' : 'Partial Payment'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Form Actions */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Record Payment
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
