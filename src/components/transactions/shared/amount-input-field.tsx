'use client';

import { type Control, type FieldValues, type Path } from 'react-hook-form';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { getTransactionTypeIcon, getTransactionTypeLabel } from '@/lib/types/transaction';
import { handleAmountChange } from '@/lib/utils/currency';
import { cn } from '@/lib/utils';

interface AmountInputFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  description?: string;
  placeholder?: string;
  watchedAmount?: string;
}

export function AmountInputField<T extends FieldValues>({
  control,
  name,
  label = 'Amount',
  description = 'Enter positive for income, negative for expenses',
  placeholder = '0.00 (use - for expenses)',
  watchedAmount,
}: AmountInputFieldProps<T>) {
  const transactionType =
    watchedAmount && parseFloat(watchedAmount) !== 0
      ? getTransactionTypeLabel(watchedAmount)
      : '';

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel htmlFor="amount-input">{label}</FormLabel>
          <FormControl>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                ₹
              </span>
              <Input
                id="amount-input"
                type="text"
                placeholder={placeholder}
                className="pl-8"
                {...field}
                onChange={(e) =>
                  handleAmountChange(e.target.value, field.onChange)
                }
              />
              {transactionType && (
                <span
                  className={cn(
                    'absolute right-3 top-1/2 -translate-y-1/2 text-sm flex items-center gap-1',
                    parseFloat(watchedAmount || '0') > 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  )}
                >
                  {getTransactionTypeIcon(watchedAmount || '0')}
                  {transactionType}
                </span>
              )}
            </div>
          </FormControl>
          <FormDescription>{description}</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
