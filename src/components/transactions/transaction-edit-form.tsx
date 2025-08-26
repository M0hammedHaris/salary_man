"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save } from 'lucide-react';
import { Form } from '@/components/ui/form';
import { 
  updateTransactionSchema, 
  type UpdateTransactionRequest,
  type Transaction
} from '@/lib/types/transaction';
import {
  AccountSelectionField,
  AmountInputField,
  CategorySelectionField,
  TransactionDateField,
  DescriptionField,
  ReceiptUploadField,
  TransactionFormWrapper,
  FormLoading,
  FormError,
  FormActions,
  useFormData,
  createReceiptHandlers,
  type ReceiptHandlers
} from './shared';

interface TransactionEditFormProps {
  transaction: Transaction;
  onSuccess?: () => void;
  onCancel?: () => void;
  isModal?: boolean;
}

export function TransactionEditForm({ 
  transaction, 
  onSuccess, 
  onCancel, 
  isModal = false 
}: TransactionEditFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(transaction.receiptUrl || null);
  
  const { formData, isLoading, error } = useFormData();

  const form = useForm<UpdateTransactionRequest>({
    resolver: zodResolver(updateTransactionSchema),
    defaultValues: {
      accountId: transaction.accountId,
      amount: transaction.amount,
      description: transaction.description,
      categoryId: transaction.categoryId,
      transactionDate: transaction.transactionDate.toString(),
      receiptUrl: transaction.receiptUrl || undefined,
    },
  });

  const { handleReceiptUpload, removeReceipt }: ReceiptHandlers = createReceiptHandlers(
    setReceiptPreview,
    (url) => form.setValue('receiptUrl', url)
  );

  const onSubmit = async (data: UpdateTransactionRequest) => {
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/transactions/${transaction.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update transaction');
      }

      onSuccess?.();
    } catch (error) {
      console.error('Error updating transaction:', error);
      form.setError('root', {
        message: error instanceof Error ? error.message : 'Failed to update transaction',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const watchedAmount = form.watch('amount');

  if (isLoading) {
    return <FormLoading message="Loading transaction details..." />;
  }

  if (error) {
    return <FormError error={error} />;
  }

  const content = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 sm:space-y-8">
        {/* Main form fields with improved spacing */}
        <div className="grid gap-6 sm:gap-8">
          {/* Row 1: Account, Amount, Category */}
          <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <AccountSelectionField
              control={form.control}
              name="accountId"
              accounts={formData.accounts}
            />

            <AmountInputField
              control={form.control}
              name="amount"
              watchedAmount={watchedAmount}
            />

            <div className="sm:col-span-2 lg:col-span-1">
              <CategorySelectionField
                control={form.control}
                name="categoryId"
                categories={formData.categories}
              />
            </div>
          </div>

          {/* Row 2: Date, Description */}
          <div className="grid gap-4 sm:gap-6 sm:grid-cols-2">
            <TransactionDateField
              control={form.control}
              name="transactionDate"
            />

            <DescriptionField
              control={form.control}
              name="description"
            />
          </div>

          {/* Row 3: Receipt Upload (full width) */}
          <div className="grid gap-4">
            <ReceiptUploadField
              control={form.control}
              name="receiptUrl"
              receiptPreview={receiptPreview}
              onReceiptUpload={handleReceiptUpload}
              onRemoveReceipt={removeReceipt}
            />
          </div>
        </div>

        {form.formState.errors.root && (
          <div className="pt-2">
            <FormError error={form.formState.errors.root.message || 'An error occurred'} />
          </div>
        )}

        <div className="pt-4 border-t">
          <FormActions
            onCancel={onCancel}
            isSubmitting={isSubmitting}
            submitLabel="Save Changes"
            submitIcon={<Save className="h-4 w-4" />}
            loadingLabel="Saving..."
            isValid={form.formState.isValid}
          />
        </div>
      </form>
    </Form>
  );

  return (
    <TransactionFormWrapper
      isModal={isModal}
      title="Edit Transaction"
      description="Update the details of this transaction"
      icon={<Save className="h-5 w-5" />}
    >
      {content}
    </TransactionFormWrapper>
  );
}
