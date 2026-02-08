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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { type Account } from '@/lib/types/account';
import { displayCurrency } from '@/lib/utils/currency';

interface AccountSelectionFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  accounts: Account[];
  label?: string;
  description?: string;
  placeholder?: string;
}

export function AccountSelectionField<T extends FieldValues>({
  control,
  name,
  accounts,
  label = 'Account',
  description = 'Choose the account for this transaction',
  placeholder = 'Select account',
}: AccountSelectionFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="space-y-2">
          <FormLabel className="text-sm font-black uppercase tracking-widest text-muted-foreground ml-1">
            {label}
          </FormLabel>
          <Select onValueChange={field.onChange} value={field.value}>
            <FormControl>
              <SelectTrigger className="h-14 rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 transition-all focus:ring-primary/20 shadow-sm group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center group-hover:bg-slate-100 transition-all">
                    <span className="material-symbols-outlined text-slate-400 text-[20px]">account_balance_wallet</span>
                  </div>
                  <SelectValue placeholder={placeholder} />
                </div>
              </SelectTrigger>
            </FormControl>
            <SelectContent className="z-[60] rounded-2xl p-1.5 border-slate-100 dark:border-slate-800 shadow-xl">
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id} className="rounded-xl font-bold px-3 py-2.5 cursor-pointer">
                  <div className="flex items-center justify-between w-full gap-8">
                    <div className="flex flex-col">
                      <span className="text-foreground">{account.name}</span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-black">
                        {account.type}
                      </span>
                    </div>
                    <span className="text-primary font-black">
                      {displayCurrency(account.balance)}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormDescription className="text-xs font-medium ml-1">{description}</FormDescription>
          <FormMessage className="ml-1 font-bold text-xs" />
        </FormItem>
      )}
    />
  );
}
