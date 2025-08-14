"use client";

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CalendarIcon, Loader2, Plus, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  createTransactionSchema, 
  type CreateTransactionRequest,
  getTransactionTypeIcon,
  getTransactionTypeLabel
} from '@/lib/types/transaction';
import { type Account } from '@/lib/types/account';
import { type Category } from '@/lib/types/category';
import { cn } from '@/lib/utils';

interface TransactionCreateFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  isModal?: boolean;
}

interface FormData {
  accounts: Account[];
  categories: Category[];
}

export function TransactionCreateForm({ onSuccess, onCancel, isModal = false }: TransactionCreateFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({ accounts: [], categories: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

  const form = useForm<CreateTransactionRequest>({
    resolver: zodResolver(createTransactionSchema),
    defaultValues: {
      accountId: '',
      amount: '',
      description: '',
      categoryId: '',
      transactionDate: new Date().toISOString(),
      receiptUrl: undefined,
    },
  });

  // Load accounts and categories on mount
  useEffect(() => {
    const loadFormData = async () => {
      try {
        const [accountsResponse, categoriesResponse] = await Promise.all([
          fetch('/api/accounts'),
          fetch('/api/categories')
        ]);

        if (!accountsResponse.ok || !categoriesResponse.ok) {
          throw new Error('Failed to load form data');
        }

        const accountsData = await accountsResponse.json();
        const categoriesData = await categoriesResponse.json();

        setFormData({
          accounts: accountsData.accounts || [],
          categories: categoriesData.categories || [],
        });
      } catch (error) {
        console.error('Error loading form data:', error);
        form.setError('root', {
          message: 'Failed to load accounts and categories. Please refresh the page.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadFormData();
  }, [form]);

  const formatCurrency = (value: string): string => {
    // Allow negative values for expenses
    const sign = value.startsWith('-') ? '-' : '';
    const numericValue = value.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = numericValue.split('.');
    if (parts.length > 2) {
      return sign + parts[0] + '.' + parts[1];
    }
    
    // Limit to 2 decimal places
    if (parts[1] && parts[1].length > 2) {
      return sign + parts[0] + '.' + parts[1].slice(0, 2);
    }
    
    return sign + numericValue;
  };

  const handleAmountChange = (value: string, onChange: (value: string) => void) => {
    const formattedValue = formatCurrency(value);
    onChange(formattedValue);
  };

  const handleReceiptUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // For now, we'll just create a preview. In production, you'd upload to Vercel Blob
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setReceiptPreview(result);
        // In production, upload to Vercel Blob and set the URL
        form.setValue('receiptUrl', result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeReceipt = () => {
    setReceiptPreview(null);
    form.setValue('receiptUrl', undefined);
  };

  const onSubmit = async (data: CreateTransactionRequest) => {
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create transaction');
      }

      form.reset({
        accountId: '',
        amount: '',
        description: '',
        categoryId: '',
        transactionDate: new Date().toISOString(),
        receiptUrl: undefined,
      });
      setReceiptPreview(null);
      onSuccess?.();
    } catch (error) {
      console.error('Error creating transaction:', error);
      form.setError('root', {
        message: error instanceof Error ? error.message : 'Failed to create transaction',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const watchedAmount = form.watch('amount');
  const transactionType = watchedAmount && parseFloat(watchedAmount) !== 0 
    ? getTransactionTypeLabel(watchedAmount)
    : '';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const content = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Account Selection */}
          <FormField
            control={form.control}
            name="accountId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {formData.accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{account.name}</span>
                          <span className="text-muted-foreground text-sm ml-2">
                            ${account.balance}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Choose the account for this transaction
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Amount */}
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      $
                    </span>
                    <Input
                      type="text"
                      placeholder="0.00 (use - for expenses)"
                      className="pl-8"
                      {...field}
                      onChange={(e) => handleAmountChange(e.target.value, field.onChange)}
                    />
                    {transactionType && (
                      <span className={cn(
                        "absolute right-3 top-1/2 -translate-y-1/2 text-sm flex items-center gap-1",
                        parseFloat(watchedAmount) > 0 ? "text-green-600" : "text-red-600"
                      )}>
                        {getTransactionTypeIcon(watchedAmount)}
                        {transactionType}
                      </span>
                    )}
                  </div>
                </FormControl>
                <FormDescription>
                  Enter positive for income, negative for expenses
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Category Selection */}
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {formData.categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: category.color }}
                          />
                          <span>{category.name}</span>
                          <span className="text-muted-foreground text-sm">
                            ({category.type})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Categorize your transaction for better tracking
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Transaction Date */}
          <FormField
            control={form.control}
            name="transactionDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Transaction Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(new Date(field.value), "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ? new Date(field.value) : undefined}
                      onSelect={(date: Date | undefined) => field.onChange(date?.toISOString())}
                      disabled={(date: Date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  When did this transaction occur?
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Description */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="What was this transaction for?"
                    className="min-h-20"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Add details about this transaction
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Receipt Upload */}
          <FormField
            control={form.control}
            name="receiptUrl"
            render={() => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Receipt (Optional)</FormLabel>
                <FormControl>
                  <div className="space-y-4">
                    {!receiptPreview ? (
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                        <div className="flex flex-col items-center gap-2 text-center">
                          <Upload className="h-8 w-8 text-muted-foreground" />
                          <div className="text-sm text-muted-foreground">
                            <label 
                              htmlFor="receipt-upload" 
                              className="font-medium text-primary cursor-pointer hover:underline"
                            >
                              Click to upload receipt
                            </label>
                            <p>PNG, JPG, PDF up to 10MB</p>
                          </div>
                          <input
                            id="receipt-upload"
                            type="file"
                            accept="image/*,.pdf"
                            onChange={handleReceiptUpload}
                            className="hidden"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Receipt uploaded</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={removeReceipt}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <Image 
                          src={receiptPreview} 
                          alt="Receipt preview" 
                          width={300}
                          height={200}
                          className="w-full max-w-xs mx-auto rounded-lg object-contain"
                        />
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormDescription>
                  Upload a receipt for this transaction
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Error Message */}
        {form.formState.errors.root && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
            {form.formState.errors.root.message}
          </div>
        )}

        {/* Form Actions */}
        <div className="flex gap-3 justify-end">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button 
            type="submit" 
            disabled={isSubmitting || !form.formState.isValid}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Add Transaction
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );

  if (isModal) {
    return content;
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Add New Transaction
        </CardTitle>
        <CardDescription>
          Record a new income or expense transaction
        </CardDescription>
      </CardHeader>
      <CardContent>
        {content}
      </CardContent>
    </Card>
  );
}
