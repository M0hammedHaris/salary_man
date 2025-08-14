"use client";

import { useState } from 'react';
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
  createAccountSchema, 
  type CreateAccountRequest, 
  AccountType, 
  accountTypeLabels,
  accountTypeIcons
} from '@/lib/types/account';
import { Loader2, Plus } from 'lucide-react';

interface AccountCreateFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  isModal?: boolean;
}

export function AccountCreateForm({ onSuccess, onCancel, isModal = false }: AccountCreateFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateAccountRequest>({
    resolver: zodResolver(createAccountSchema),
    defaultValues: {
      name: '',
      type: AccountType.CHECKING,
      balance: '0.00',
      description: '',
    },
  });

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

  const handleBalanceChange = (value: string, onChange: (value: string) => void) => {
    const formattedValue = formatCurrency(value);
    onChange(formattedValue);
  };

  const onSubmit = async (data: CreateAccountRequest) => {
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create account');
      }

      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error('Error creating account:', error);
      form.setError('root', {
        message: error instanceof Error ? error.message : 'Failed to create account',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const content = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Account Name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                  <FormLabel htmlFor="account-name">Account Name</FormLabel>
                  <FormControl>
                    <Input
                      id="account-name"
                      placeholder="My Checking Account"
                      {...field}
                    />
                  </FormControl>
                <FormDescription>
                  Enter a descriptive name for your account
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
                  <FormLabel htmlFor="account-type">Account Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger id="account-type" className="w-full">
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

          {/* Initial Balance */}
          <FormField
            control={form.control}
            name="balance"
            render={({ field }) => (
              <FormItem>
                  <FormLabel htmlFor="account-balance">Initial Balance</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                        $
                      </span>
                      <Input
                        id="account-balance"
                        type="text"
                        placeholder="0.00"
                        className="pl-8"
                        {...field}
                        onChange={(e) => handleBalanceChange(e.target.value, field.onChange)}
                      />
                    </div>
                  </FormControl>
                <FormDescription>
                  Enter the current balance
                </FormDescription>
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
                <FormItem className="sm:col-span-2">
                    <FormLabel htmlFor="account-credit-limit">Credit Limit (Optional)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                          $
                        </span>
                        <Input
                          id="account-credit-limit"
                          type="text"
                          placeholder="5000.00"
                          className="pl-8"
                          value={field.value || ''}
                          onChange={(e) => handleBalanceChange(e.target.value, field.onChange)}
                        />
                      </div>
                    </FormControl>
                  <FormDescription>
                    Enter the credit limit for this card
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
                  <FormLabel htmlFor="account-description">Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      id="account-description"
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
            disabled={isSubmitting}
            className="min-w-[100px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Create Account
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
          Create New Account
        </CardTitle>
        <CardDescription>
          Add a new bank account to track your finances
        </CardDescription>
      </CardHeader>
      <CardContent>
        {content}
      </CardContent>
    </Card>
  );
}
