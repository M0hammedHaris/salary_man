'use client';

import { type Control, type FieldValues, type Path } from 'react-hook-form';
import { Zap } from 'lucide-react';
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
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select onValueChange={field.onChange} value={field.value}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent className="z-[60]">
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span>{category.name}</span>
                    <span className="text-muted-foreground text-sm">
                      ({category.type})
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* Smart suggestion indicator */}
          {showSmartSuggestion && hasSuggestion && !field.value && (
            <div className="text-xs text-blue-600 flex items-center gap-1 mt-1">
              <Zap className="h-3 w-3" />
              Smart suggestion available
            </div>
          )}
          <FormDescription>{description}</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
