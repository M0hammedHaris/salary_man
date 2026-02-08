'use client';

import { type Control, type FieldValues, type Path } from 'react-hook-form';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface TransactionDateFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  description?: string;
  placeholder?: string;
}

export function TransactionDateField<T extends FieldValues>({
  control,
  name,
  label = 'Transaction Date',
  description = 'When did this transaction occur?',
  placeholder = 'Pick a date',
}: TransactionDateFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        return (
          <FormItem className="space-y-2">
            <FormLabel className="text-sm font-black uppercase tracking-widest text-muted-foreground ml-1">
              {label}
            </FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    className={cn(
                      'h-14 w-full pl-4 pr-4 rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all focus:ring-primary/20 shadow-sm text-left font-bold group',
                      !field.value && 'text-muted-foreground font-medium'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center group-hover:bg-slate-100 transition-all text-slate-400">
                        <span className="material-symbols-outlined text-[20px]">calendar_today</span>
                      </div>
                      {field.value ? (
                        format(new Date(field.value), 'PPP')
                      ) : (
                        <span>{placeholder}</span>
                      )}
                    </div>
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-[60] rounded-2xl border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden" align="start">
                <Calendar
                  mode="single"
                  selected={field.value ? new Date(field.value) : undefined}
                  onSelect={(date: Date | undefined) => field.onChange(date?.toISOString())}
                  disabled={(date: Date) => date > new Date() || date < new Date('1900-01-01')}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <FormDescription className="text-xs font-medium ml-1">{description}</FormDescription>
            <FormMessage className="ml-1 font-bold text-xs" />
          </FormItem>
        );
      }}
    />
  );
}
