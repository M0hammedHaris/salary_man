'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { handleAmountChange } from '@/lib/utils/currency';

interface Account {
  id: string;
  name: string;
  type: string;
}

interface Category {
  id: string;
  name: string;
  type: string;
}

interface Bill {
  id: string;
  name: string;
  amount: string;
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  nextDueDate: string;
  accountId: string;
  categoryId: string;
  reminderDays: string;
}

const billFormSchema = z.object({
  name: z.string().min(1, 'Bill name is required'),
  amount: z.string().min(1, 'Amount is required').regex(/^\d+(\.\d{1,2})?$/, 'Invalid amount format'),
  frequency: z.enum(['weekly', 'monthly', 'quarterly', 'yearly']),
  nextDueDate: z.date().refine((date) => date instanceof Date, {
    message: 'Due date is required',
  }),
  accountId: z.string().min(1, 'Account is required'),
  categoryId: z.string().min(1, 'Category is required'),
  reminderDays: z.string().optional(),
});

type BillFormData = z.infer<typeof billFormSchema>;

interface BillSetupFormProps {
  bill?: Bill | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function BillSetupForm({ bill, open, onClose, onSuccess }: BillSetupFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const form = useForm<BillFormData>({
    resolver: zodResolver(billFormSchema),
    defaultValues: {
      name: '',
      amount: '',
      frequency: 'monthly',
      nextDueDate: new Date(),
      accountId: '',
      categoryId: '',
      reminderDays: '1,3,7',
    },
  });

  // Load accounts and categories
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingData(true);
        const [accountsResponse, categoriesResponse] = await Promise.all([
          fetch('/api/accounts'),
          fetch('/api/categories'),
        ]);

        if (!accountsResponse.ok || !categoriesResponse.ok) {
          throw new Error('Failed to load data');
        }

        const accountsData = await accountsResponse.json();
        const categoriesData = await categoriesResponse.json();

        setAccounts(accountsData);
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoadingData(false);
      }
    };

    if (open) {
      loadData();
    }
  }, [open]);

  // Set form values when editing a bill
  useEffect(() => {
    if (bill && open) {
      form.reset({
        name: bill.name,
        amount: bill.amount,
        frequency: bill.frequency,
        nextDueDate: new Date(bill.nextDueDate),
        accountId: bill.accountId,
        categoryId: bill.categoryId,
        reminderDays: bill.reminderDays || '1,3,7',
      });
    } else if (open) {
      form.reset({
        name: '',
        amount: '',
        frequency: 'monthly',
        nextDueDate: new Date(),
        accountId: '',
        categoryId: '',
        reminderDays: '1,3,7',
      });
    }
  }, [bill, open, form]);

  const onSubmit = async (data: BillFormData) => {
    setIsLoading(true);

    try {
      const url = bill ? `/api/bills/${bill.id}` : '/api/bills';
      const method = bill ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          nextDueDate: data.nextDueDate.toISOString(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save bill');
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving bill:', error);
      // You might want to show a toast or error message here
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{bill ? 'Edit Bill' : 'Add New Bill'}</DialogTitle>
        </DialogHeader>

        {loadingData ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Bill Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Bill Name</Label>
              <Input
                id="name"
                placeholder="e.g., Credit Card Payment, Electricity Bill"
                {...form.register('name')}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input
                id="amount"
                placeholder="0.00"
                {...form.register('amount')}
                onChange={(e) => handleAmountChange(e.target.value, (value) => form.setValue('amount', value))}
              />
              {form.formState.errors.amount && (
                <p className="text-sm text-destructive">{form.formState.errors.amount.message}</p>
              )}
            </div>

            {/* Frequency */}
            <div className="space-y-2">
              <Label>Frequency</Label>
              <Select
                value={form.watch('frequency')}
                onValueChange={(value) => form.setValue('frequency', value as 'weekly' | 'monthly' | 'quarterly' | 'yearly')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.frequency && (
                <p className="text-sm text-destructive">{form.formState.errors.frequency.message}</p>
              )}
            </div>

            {/* Next Due Date */}
            <div className="space-y-2">
              <Label>Next Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !form.watch('nextDueDate') && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.watch('nextDueDate') ? (
                      format(form.watch('nextDueDate'), 'PPP')
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={form.watch('nextDueDate')}
                    onSelect={(date) => date && form.setValue('nextDueDate', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {form.formState.errors.nextDueDate && (
                <p className="text-sm text-destructive">{form.formState.errors.nextDueDate.message}</p>
              )}
            </div>

            {/* Account */}
            <div className="space-y-2">
              <Label>Account</Label>
              <Select
                value={form.watch('accountId')}
                onValueChange={(value) => form.setValue('accountId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name} ({account.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.accountId && (
                <p className="text-sm text-destructive">{form.formState.errors.accountId.message}</p>
              )}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={form.watch('categoryId')}
                onValueChange={(value) => form.setValue('categoryId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.categoryId && (
                <p className="text-sm text-destructive">{form.formState.errors.categoryId.message}</p>
              )}
            </div>

            {/* Reminder Days */}
            <div className="space-y-2">
              <Label htmlFor="reminderDays">Reminder Days (comma-separated)</Label>
              <Input
                id="reminderDays"
                placeholder="1,3,7,14"
                {...form.register('reminderDays')}
              />
              <p className="text-xs text-muted-foreground">
                Days before due date to send reminders (e.g., 1,3,7 for 1, 3, and 7 days before)
              </p>
              {form.formState.errors.reminderDays && (
                <p className="text-sm text-destructive">{form.formState.errors.reminderDays.message}</p>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {bill ? 'Update Bill' : 'Add Bill'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
