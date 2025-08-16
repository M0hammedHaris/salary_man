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
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select onValueChange={field.onChange} value={field.value}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent className="z-[60]">
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  <div className="flex items-center justify-between w-full">
                    <span>{account.name}</span>
                    <span className="text-muted-foreground text-sm ml-2">
                      {displayCurrency(account.balance)}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormDescription>{description}</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
