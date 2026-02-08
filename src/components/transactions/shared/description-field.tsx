"use client";

import { type Control, type FieldValues, type Path } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";


interface DescriptionFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  description?: string;
  placeholder?: string;
}

export function DescriptionField<T extends FieldValues>(
  {
    control,
    name,
    label = 'Description',
    description = 'What was this transaction for?',
    placeholder = 'Enter a description...',
  }: DescriptionFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="space-y-2">
          <FormLabel className="text-sm font-black uppercase tracking-widest text-muted-foreground ml-1">
            {label}
          </FormLabel>
          <div className="relative group">
            <div className="absolute left-4 top-4 w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-focus-within:text-primary transition-all">
              <span className="material-symbols-outlined text-[20px]">notes</span>
            </div>
            <FormControl>
              <Textarea
                placeholder={placeholder}
                className="min-h-[100px] pl-14 rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all focus:ring-primary/20 shadow-sm resize-none py-4"
                {...field}
              />
            </FormControl>
          </div>
          <FormDescription className="text-xs font-medium ml-1">
            {description}
          </FormDescription>
          <FormMessage className="ml-1 font-bold text-xs" />
        </FormItem>
      )}
    />
  );
}
