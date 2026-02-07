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
  placeholder = '0.00',
  watchedAmount,
}: AmountInputFieldProps<T>) {
  const isNeg = watchedAmount && parseFloat(watchedAmount) < 0;
  const isPos = watchedAmount && parseFloat(watchedAmount) > 0;

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="space-y-2">
          <FormLabel className="text-sm font-black uppercase tracking-widest text-muted-foreground ml-1">
            {label}
          </FormLabel>
          <FormControl>
            <div className="relative group">
              <div className={cn(
                "absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl flex items-center justify-center transition-all",
                isPos ? "bg-emerald-50 text-emerald-500" :
                  isNeg ? "bg-rose-50 text-rose-500" :
                    "bg-slate-50 text-slate-400 dark:bg-slate-800"
              )}>
                <span className="font-black text-sm">₹</span>
              </div>
              <Input
                id="amount-input"
                type="text"
                placeholder={placeholder}
                className={cn(
                  "h-14 pl-14 pr-12 text-xl font-black rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all focus:ring-primary/20 shadow-sm",
                  isPos && "text-emerald-500 border-emerald-100 dark:border-emerald-900/30",
                  isNeg && "text-rose-500 border-rose-100 dark:border-rose-900/30"
                )}
                {...field}
                onChange={(e) =>
                  handleAmountChange(e.target.value, field.onChange)
                }
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {isPos && (
                  <span className="material-symbols-outlined text-emerald-500 animate-in fade-in zoom-in duration-300">add_circle</span>
                )}
                {isNeg && (
                  <span className="material-symbols-outlined text-rose-500 animate-in fade-in zoom-in duration-300">do_not_disturb_on</span>
                )}
              </div>
            </div>
          </FormControl>
          <FormDescription className="text-xs font-medium ml-1">
            {description}
          </FormDescription>
          <FormMessage className="ml-1 font-bold text-xs" />
        </FormItem>
      )}
    />
  );
}
