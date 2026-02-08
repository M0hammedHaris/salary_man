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
import { type Category } from '@/lib/types/category';

interface CategorySelectionFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  categories: Category[];
  label?: string;
  description?: string;
  placeholder?: string;
  showSmartSuggestion?: boolean;
  hasSuggestion?: boolean;
}

export function CategorySelectionField<T extends FieldValues>({
  control,
  name,
  categories,
  label = 'Category',
  description = 'Categorize your transaction for better tracking',
  placeholder = 'Select category',
  showSmartSuggestion = false,
  hasSuggestion = false,
}: CategorySelectionFieldProps<T>) {
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
                    <span className="material-symbols-outlined text-slate-400 text-[20px]">category</span>
                  </div>
                  <SelectValue placeholder={placeholder} />
                </div>
              </SelectTrigger>
            </FormControl>
            <SelectContent className="z-[60] rounded-2xl p-1.5 border-slate-100 dark:border-slate-800 shadow-xl">
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id} className="rounded-xl font-bold px-3 py-2.5 cursor-pointer">
                  <div className="flex items-center gap-3 w-full">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      <span
                        className="material-symbols-outlined text-xl"
                        style={{ color: category.color }}
                      >
                        {category.icon || 'payments'}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-foreground">{category.name}</span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-black">
                        {category.type}
                      </span>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {showSmartSuggestion && hasSuggestion && !field.value && (
            <div className="text-xs text-primary flex items-center gap-1 mt-2 px-1 font-bold">
              <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
              Smart suggestion available
            </div>
          )}
          <FormDescription className="text-xs font-medium ml-1">{description}</FormDescription>
          <FormMessage className="ml-1 font-bold text-xs" />
        </FormItem>
      )}
    />
  );
}
