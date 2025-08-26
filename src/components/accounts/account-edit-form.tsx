"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  updateAccountSchema, 
  type UpdateAccountRequest,
  type AccountResponse,
  AccountType, 
  accountTypeLabels,
  accountTypeIcons
} from '@/lib/types/account';
import { Loader2, Edit, X } from 'lucide-react';

interface AccountEditFormProps {
  account: AccountResponse;
  onSuccess?: () => void;
  onCancel?: () => void;
  isModal?: boolean;
}

export function AccountEditForm({ account, onSuccess, onCancel, isModal = false }: AccountEditFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<UpdateAccountRequest>({
    resolver: zodResolver(updateAccountSchema),
    defaultValues: {
      name: account.name,
      type: account.type as AccountType,
      creditLimit: account.creditLimit,
      description: '', // We don't have description in the current schema, but preparing for it
    },
  });

  useEffect(() => {
    // Reset form when account changes
    form.reset({
      name: account.name,
      type: account.type as AccountType,
      creditLimit: account.creditLimit,
      description: '',
    });
  }, [account, form]);

  const formatCurrency = (value: string): string => {
    // Remove non-numeric characters except decimal point
    const numericValue = value.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = numericValue.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts[1];
    }
    
    // Limit to 2 decimal places
    if (parts[1] && parts[1].length > 2) {
      return parts[0] + '.' + parts[1].slice(0, 2);
    }
    
    return numericValue;
  };

  const handleCreditLimitChange = (value: string, onChange: (value: string) => void) => {
    const formattedValue = formatCurrency(value);
    onChange(formattedValue);
  };

  const onSubmit = async (data: UpdateAccountRequest) => {
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/accounts/${account.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update account');
      }

      onSuccess?.();
    } catch (error) {
      console.error('Error updating account:', error);
      form.setError('root', {
        message: error instanceof Error ? error.message : 'Failed to update account',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const content = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Current Balance Display (Read-only) */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Current Balance</p>
              <p className="text-xl font-semibold">
                ₹{parseFloat(account.balance).toFixed(2)}
              </p>
            </div>
            <div className="text-xs text-muted-foreground text-right">
              <p>Balance cannot be edited</p>
              <p>Use transactions to update</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Account Name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Account Name</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="My Checking Account" 
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Update the descriptive name for your account
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Account Type */}
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account Type</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select account type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(AccountType).map((type) => (
                      <SelectItem key={type} value={type}>
                        <span className="flex items-center gap-2">
                          <span>{accountTypeIcons[type]}</span>
                          {accountTypeLabels[type]}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Credit Limit (conditional) */}
          {form.watch('type') === AccountType.CREDIT_CARD && (
            <FormField
              control={form.control}
              name="creditLimit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Credit Limit</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                        ₹
                      </span>
                      <Input
                        type="text"
                        placeholder="5000.00"
                        className="pl-8"
                        value={field.value || ''}
                        onChange={(e) => handleCreditLimitChange(e.target.value, field.onChange)}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Update the credit limit for this card
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Description */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Description (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Additional notes about this account..."
                    className="min-h-20"
                    {...field}
                  />
                </FormControl>
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
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Edit className="mr-2 h-4 w-4" />
                Update Account
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
          <Edit className="h-5 w-5" />
          Edit Account
        </CardTitle>
        <CardDescription>
          Update your account details. Note that balance cannot be changed directly.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {content}
      </CardContent>
    </Card>
  );
}
