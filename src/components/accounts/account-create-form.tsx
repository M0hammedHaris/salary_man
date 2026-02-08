"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
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
import { Card, CardContent } from '@/components/ui/card';
import {
  createAccountSchema,
  type CreateAccountRequest,
  AccountType,
  accountTypeLabels,
} from '@/lib/types/account';
import { Loader2 } from 'lucide-react';

const accountTypeMaterialIcons: Record<AccountType, string> = {
  [AccountType.CHECKING]: 'payments',
  [AccountType.SAVINGS]: 'savings',
  [AccountType.INVESTMENT]: 'monitoring',
  [AccountType.CREDIT_CARD]: 'credit_card',
  [AccountType.OTHER]: 'account_balance'
};

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

  const formatCurrencyValue = (value: string): string => {
    const numericValue = value.replace(/[^0-9.]/g, '');
    const parts = numericValue.split('.');
    if (parts.length > 2) return parts[0] + '.' + parts[1];
    if (parts[1] && parts[1].length > 2) return parts[0] + '.' + parts[1].slice(0, 2);
    return numericValue;
  };

  const handleBalanceChange = (value: string, onChange: (value: string) => void) => {
    onChange(formatCurrencyValue(value));
  };

  const onSubmit = async (data: CreateAccountRequest) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  const formContent = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
        <div className="grid gap-8 sm:grid-cols-2">
          {/* Account Name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-3 block">Account Name</FormLabel>
                <FormControl>
                  <div className="relative group">
                    <Input
                      placeholder="e.g. Primary Checking"
                      className="h-12 px-4 bg-slate-50 border-none rounded-[16px] text-base font-bold focus-visible:ring-primary focus-visible:ring-offset-0 transition-all group-hover:bg-slate-100"
                      {...field}
                    />
                    <div className="absolute inset-x-0 bottom-0 h-1 bg-primary scale-x-0 group-focus-within:scale-x-100 transition-transform rounded-b-[16px]" />
                  </div>
                </FormControl>
                <FormMessage className="text-[10px] font-bold uppercase tracking-wider text-rose-500 mt-2" />
              </FormItem>
            )}
          />

          {/* Account Type */}
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-3 block">Account Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-12 px-4 bg-slate-50 border-none rounded-[16px] text-base font-bold focus:ring-primary focus:ring-offset-0 hover:bg-slate-100 transition-all">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="rounded-[16px] p-1 border-slate-100 shadow-xl">
                    {Object.values(AccountType).map((type) => (
                      <SelectItem key={type} value={type} className="rounded-xl py-3 focus:bg-primary/5 cursor-pointer">
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-slate-400">{accountTypeMaterialIcons[type]}</span>
                          <span className="font-bold">{accountTypeLabels[type]}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage className="text-[10px] font-bold uppercase tracking-wider text-rose-500 mt-2" />
              </FormItem>
            )}
          />

          {/* Initial Balance */}
          <FormField
            control={form.control}
            name="balance"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-3 block">Initial Balance</FormLabel>
                <FormControl>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center pointer-events-none">
                      <span className="text-emerald-500 font-black text-xs">₹</span>
                    </div>
                    <Input
                      type="text"
                      placeholder="0.00"
                      className="h-12 pl-12 pr-4 bg-slate-50 border-none rounded-[16px] text-lg font-black text-emerald-600 focus-visible:ring-emerald-500/20 focus-visible:ring-offset-0 transition-all group-hover:bg-slate-100 placeholder:text-emerald-200"
                      {...field}
                      onChange={(e) => handleBalanceChange(e.target.value, field.onChange)}
                    />
                  </div>
                </FormControl>
                <FormMessage className="text-[10px] font-bold uppercase tracking-wider text-rose-500 mt-2" />
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
                  <FormLabel className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-3 block">Credit Limit (Optional)</FormLabel>
                  <FormControl>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-rose-500/10 flex items-center justify-center pointer-events-none">
                        <span className="text-rose-500 font-black text-xs">₹</span>
                      </div>
                      <Input
                        type="text"
                        placeholder="50000.00"
                        className="h-12 pl-12 pr-4 bg-slate-50 border-none rounded-[16px] text-lg font-black text-rose-600 focus-visible:ring-rose-500/20 focus-visible:ring-offset-0 transition-all group-hover:bg-slate-100 placeholder:text-rose-200"
                        value={field.value || ''}
                        onChange={(e) => handleBalanceChange(e.target.value, field.onChange)}
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-[10px] font-bold uppercase tracking-wider text-rose-500 mt-2" />
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
                <FormLabel className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-3 block">Description (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Add some notes about this account..."
                    className="min-h-[100px] px-4 py-3 bg-slate-50 border-none rounded-[16px] text-base font-medium focus-visible:ring-primary focus-visible:ring-offset-0 transition-all hover:bg-slate-100 resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-[10px] font-bold uppercase tracking-wider text-rose-500 mt-2" />
              </FormItem>
            )}
          />
        </div>

        {/* Error Message */}
        {form.formState.errors.root && (
          <div className="text-xs font-bold text-rose-500 bg-rose-50 p-5 rounded-[20px] border border-rose-100 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[20px]">warning</span>
              {form.formState.errors.root.message}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row gap-4 pt-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center h-12 rounded-[16px] bg-slate-100 text-slate-600 font-black text-base hover:bg-slate-200 active:scale-95 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-[2] flex items-center justify-center gap-2 h-12 rounded-[16px] bg-primary text-white font-black text-base hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/20 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Creating...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[24px]">add_circle</span>
                <span>Create Account</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Form>
  );

  if (isModal) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-[48px] overflow-hidden shadow-2xl">
        <div className="relative h-24 bg-slate-900 flex items-center px-6 overflow-hidden">
          {/* Abstract background blobs */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-2xl -mr-16 -mt-16" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -ml-12 -mb-12" />

          <div className="relative z-10 flex items-center gap-4">
            <div className="w-12 h-12 rounded-[16px] bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-2xl">
              <span className="material-symbols-outlined text-2xl text-white">account_balance_wallet</span>
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">New Account</h2>
              <p className="text-slate-400 font-bold text-xs">Track your assets & liabilities</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          {formContent}
        </div>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto border-none shadow-2xl rounded-[48px] overflow-hidden">
      <div className="relative h-48 bg-slate-900 flex items-center px-10 overflow-hidden">
        {/* Abstract background blobs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl -ml-24 -mb-24" />

        <div className="relative z-10 flex items-center gap-6">
          <div className="w-20 h-20 rounded-[30px] bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-2xl">
            <span className="material-symbols-outlined text-4xl text-white">account_balance_wallet</span>
          </div>
          <div>
            <h2 className="text-3xl font-black text-white tracking-tight">New Account</h2>
            <p className="text-slate-400 font-bold">Track your assets & liabilities</p>
          </div>
        </div>
      </div>
      <CardContent className="p-10 bg-white dark:bg-slate-900">
        {formContent}
      </CardContent>
    </Card>
  );
}
