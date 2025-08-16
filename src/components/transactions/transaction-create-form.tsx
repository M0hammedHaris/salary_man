"use client";

import Image from 'next/image';
import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CalendarIcon, Loader2, Plus, Upload, X, Zap, Split, Copy, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  createTransactionSchema, 
  type CreateTransactionRequest,
  getTransactionTypeIcon,
  getTransactionTypeLabel
} from '@/lib/types/transaction';
import { type Account } from '@/lib/types/account';
import { type Category } from '@/lib/types/category';
import { cn } from '@/lib/utils';

interface TransactionCreateFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  isModal?: boolean;
}

interface FormData {
  accounts: Account[];
  categories: Category[];
  templates: TransactionTemplate[];
}

interface TransactionTemplate {
  id: string;
  name: string;
  amount: string;
  description: string;
  categoryId: string;
  accountId?: string;
}

interface SplitEntry {
  categoryId: string;
  amount: string;
  description: string;
}

export function TransactionCreateForm({ onSuccess, onCancel, isModal = false }: TransactionCreateFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({ accounts: [], categories: [], templates: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [showSplitMode, setShowSplitMode] = useState(false);
  const [splitEntries, setSplitEntries] = useState<SplitEntry[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showBulkMode, setShowBulkMode] = useState(false);
  const [bulkEntries, setBulkEntries] = useState<CreateTransactionRequest[]>([]);

  const form = useForm<CreateTransactionRequest>({
    resolver: zodResolver(createTransactionSchema),
    defaultValues: {
      accountId: '',
      amount: '',
      description: '',
      categoryId: '',
      transactionDate: new Date().toISOString(),
      receiptUrl: undefined,
    },
  });

  // Watch description field for smart suggestions
  const watchedDescription = form.watch('description');

  // Smart category suggestion based on description
  const suggestCategory = useCallback((description: string): string | null => {
    if (!description || description.length < 3) return null;
    
    const descLower = description.toLowerCase();
    const { categories } = formData;
    
    // Keywords mapping for common transactions
    const categoryKeywords: Record<string, string[]> = {
      'food': ['restaurant', 'food', 'dinner', 'lunch', 'breakfast', 'cafe', 'pizza', 'burger', 'grocery', 'groceries', 'supermarket'],
      'transportation': ['uber', 'taxi', 'gas', 'fuel', 'bus', 'train', 'metro', 'parking', 'toll'],
      'shopping': ['amazon', 'flipkart', 'shop', 'mall', 'store', 'purchase', 'buy'],
      'utilities': ['electricity', 'water', 'internet', 'phone', 'mobile', 'wifi', 'bill'],
      'entertainment': ['movie', 'cinema', 'netflix', 'spotify', 'game', 'concert', 'show'],
      'medical': ['doctor', 'hospital', 'pharmacy', 'medicine', 'medical', 'health'],
      'salary': ['salary', 'wage', 'income', 'payment', 'payroll'],
    };

    // Find matching category
    for (const [categoryName, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => descLower.includes(keyword))) {
        const matchingCategory = categories.find(cat => 
          cat.name.toLowerCase().includes(categoryName) || 
          categoryName.includes(cat.name.toLowerCase())
        );
        if (matchingCategory) {
          return matchingCategory.id;
        }
      }
    }

    return null;
  }, [formData]);

  // Auto-suggest category when description changes
  useEffect(() => {
    if (watchedDescription && watchedDescription.length >= 3) {
      const currentCategoryId = form.getValues('categoryId');
      if (!currentCategoryId) {
        const suggestedCategoryId = suggestCategory(watchedDescription);
        if (suggestedCategoryId) {
          // Auto-select suggested category after a short delay
          setTimeout(() => {
            form.setValue('categoryId', suggestedCategoryId);
          }, 500);
        }
      }
    }
  }, [watchedDescription, form, suggestCategory]);

  // Load accounts and categories on mount
  useEffect(() => {
    const loadFormData = async () => {
      try {
        const [accountsResponse, categoriesResponse] = await Promise.all([
          fetch('/api/accounts'),
          fetch('/api/categories')
        ]);

        if (!accountsResponse.ok || !categoriesResponse.ok) {
          throw new Error('Failed to load form data');
        }

        const accountsData = await accountsResponse.json();
        const categoriesData = await categoriesResponse.json();

        // Load templates from localStorage (in production, this would be an API call)
        const savedTemplates = localStorage.getItem('transactionTemplates');
        const templates = savedTemplates ? JSON.parse(savedTemplates) : [];

        setFormData({
          accounts: accountsData.accounts || [],
          categories: categoriesData.categories || [],
          templates: templates,
        });
      } catch (error) {
        console.error('Error loading form data:', error);
        form.setError('root', {
          message: 'Failed to load accounts and categories. Please refresh the page.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadFormData();
  }, [form]);

  const formatCurrency = (value: string): string => {
    // Allow negative values for expenses
    const sign = value.startsWith('-') ? '-' : '';
    const numericValue = value.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = numericValue.split('.');
    if (parts.length > 2) {
      return sign + parts[0] + '.' + parts[1];
    }
    
    // Limit to 2 decimal places
    if (parts[1] && parts[1].length > 2) {
      return sign + parts[0] + '.' + parts[1].slice(0, 2);
    }
    
    return sign + numericValue;
  };

  const handleAmountChange = (value: string, onChange: (value: string) => void) => {
    const formattedValue = formatCurrency(value);
    onChange(formattedValue);
  };

  const handleReceiptUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // For now, we'll just create a preview. In production, you'd upload to Vercel Blob
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setReceiptPreview(result);
        // In production, upload to Vercel Blob and set the URL
        form.setValue('receiptUrl', result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeReceipt = () => {
    setReceiptPreview(null);
    form.setValue('receiptUrl', undefined);
  };

  // Split transaction functions
  const addSplitEntry = () => {
    setSplitEntries(prev => [...prev, { categoryId: '', amount: '', description: '' }]);
  };

  const removeSplitEntry = (index: number) => {
    setSplitEntries(prev => prev.filter((_, i) => i !== index));
  };

  const updateSplitEntry = (index: number, field: keyof SplitEntry, value: string) => {
    setSplitEntries(prev => prev.map((entry, i) => 
      i === index ? { ...entry, [field]: value } : entry
    ));
  };

  const calculateSplitTotal = () => {
    return splitEntries.reduce((total, entry) => {
      const amount = parseFloat(entry.amount) || 0;
      return total + amount;
    }, 0).toFixed(2);
  };

  const getSplitDifference = () => {
    const transactionAmount = Math.abs(parseFloat(form.watch('amount')) || 0);
    const splitTotal = parseFloat(calculateSplitTotal());
    return splitTotal - transactionAmount;
  };

  // Template functions
  const saveAsTemplate = () => {
    const formValues = form.getValues();
    if (!formValues.description || !formValues.amount || !formValues.categoryId) {
      form.setError('root', {
        message: 'Please fill out description, amount, and category before saving as template',
      });
      return;
    }

    const templateName = prompt('Enter a name for this template:');
    if (!templateName) return;

    const newTemplate: TransactionTemplate = {
      id: Date.now().toString(),
      name: templateName,
      amount: Math.abs(parseFloat(formValues.amount)).toString(),
      description: formValues.description,
      categoryId: formValues.categoryId,
      accountId: formValues.accountId,
    };

    setFormData(prev => ({
      ...prev,
      templates: [...prev.templates, newTemplate]
    }));

    // In production, you'd save this to the backend
    localStorage.setItem('transactionTemplates', JSON.stringify([...formData.templates, newTemplate]));
  };

  const applyTemplate = (template: TransactionTemplate) => {
    form.setValue('description', template.description);
    form.setValue('amount', template.amount);
    form.setValue('categoryId', template.categoryId);
    if (template.accountId) {
      form.setValue('accountId', template.accountId);
    }
  };

  const deleteTemplate = (templateId: string) => {
    const updatedTemplates = formData.templates.filter(t => t.id !== templateId);
    setFormData(prev => ({
      ...prev,
      templates: updatedTemplates
    }));
    
    // In production, you'd delete this from the backend
    localStorage.setItem('transactionTemplates', JSON.stringify(updatedTemplates));
  };

  // Bulk entry functions
  const addBulkEntry = () => {
    setBulkEntries(prev => [...prev, {
      accountId: '',
      amount: '',
      description: '',
      categoryId: '',
      transactionDate: new Date().toISOString(),
      receiptUrl: undefined,
    }]);
  };

  const removeBulkEntry = (index: number) => {
    setBulkEntries(prev => prev.filter((_, i) => i !== index));
  };

  const updateBulkEntry = (index: number, field: keyof CreateTransactionRequest, value: string) => {
    setBulkEntries(prev => prev.map((entry, i) => 
      i === index ? { ...entry, [field]: value } : entry
    ));
  };

  const submitBulkEntries = async () => {
    setIsSubmitting(true);
    
    try {
      // Validate all entries
      const invalidEntries = bulkEntries.filter(entry => 
        !entry.accountId || !entry.amount || !entry.description || !entry.categoryId
      );
      
      if (invalidEntries.length > 0) {
        throw new Error('All bulk entries must have account, amount, description, and category');
      }

      // Create all transactions
      const createPromises = bulkEntries.map(async (entry) => {
        const response = await fetch('/api/transactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(entry),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create bulk transaction');
        }

        return response.json();
      });

      await Promise.all(createPromises);

      // Reset bulk state
      setBulkEntries([]);
      setShowBulkMode(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error creating bulk transactions:', error);
      form.setError('root', {
        message: error instanceof Error ? error.message : 'Failed to create bulk transactions',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = async (data: CreateTransactionRequest) => {
    setIsSubmitting(true);
    
    try {
      if (showSplitMode && splitEntries.length > 0) {
        // Handle split transaction
        if (Math.abs(getSplitDifference()) > 0.01) {
          throw new Error('Split amounts must equal the transaction total');
        }

        // Create multiple transactions for each split
        const splitPromises = splitEntries.map(async (entry) => {
          const splitData = {
            ...data,
            amount: data.amount.startsWith('-') ? `-${entry.amount}` : entry.amount,
            categoryId: entry.categoryId,
            description: entry.description || data.description,
          };

          const response = await fetch('/api/transactions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(splitData),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create split transaction');
          }

          return response.json();
        });

        await Promise.all(splitPromises);
      } else {
        // Handle regular transaction
        const response = await fetch('/api/transactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create transaction');
        }
      }

      // Reset form and state
      form.reset({
        accountId: '',
        amount: '',
        description: '',
        categoryId: '',
        transactionDate: new Date().toISOString(),
        receiptUrl: undefined,
      });
      setReceiptPreview(null);
      setShowSplitMode(false);
      setSplitEntries([]);
      onSuccess?.();
    } catch (error) {
      console.error('Error creating transaction:', error);
      form.setError('root', {
        message: error instanceof Error ? error.message : 'Failed to create transaction',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const watchedAmount = form.watch('amount');
  const transactionType = watchedAmount && parseFloat(watchedAmount) !== 0 
    ? getTransactionTypeLabel(watchedAmount)
    : '';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const content = (
    <Form {...form}>
      {/* Quick Actions Section */}
      <div className="mb-6 p-4 bg-muted/30 rounded-lg border">
        <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
          <Zap className="h-4 w-4" />
          Quick Actions
        </h3>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              form.setValue('description', 'Salary payment');
              form.setValue('amount', '');
              const salaryCategory = formData.categories.find(cat => 
                cat.name.toLowerCase().includes('salary') || cat.name.toLowerCase().includes('income')
              );
              if (salaryCategory) form.setValue('categoryId', salaryCategory.id);
            }}
          >
            <Copy className="h-3 w-3 mr-1" />
            Salary
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              form.setValue('description', 'Grocery shopping');
              form.setValue('amount', '-');
              const groceryCategory = formData.categories.find(cat => 
                cat.name.toLowerCase().includes('grocery') || cat.name.toLowerCase().includes('food')
              );
              if (groceryCategory) form.setValue('categoryId', groceryCategory.id);
            }}
          >
            <Copy className="h-3 w-3 mr-1" />
            Groceries
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowSplitMode(!showSplitMode)}
          >
            <Split className="h-3 w-3 mr-1" />
            Split Transaction
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowTemplates(!showTemplates)}
          >
            <BookOpen className="h-3 w-3 mr-1" />
            Templates
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowBulkMode(!showBulkMode)}
          >
            <Plus className="h-3 w-3 mr-1" />
            Bulk Entry
          </Button>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Account Selection */}
          <FormField
            control={form.control}
            name="accountId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {formData.accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{account.name}</span>
                          <span className="text-muted-foreground text-sm ml-2">
                            {formatCurrency(account.balance.toString())}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Choose the account for this transaction
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Amount */}
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="amount-input">Amount</FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      ₹
                    </span>
                    <Input
                      id="amount-input"
                      type="text"
                      placeholder="0.00 (use - for expenses)"
                      className="pl-8"
                      {...field}
                      onChange={(e) => handleAmountChange(e.target.value, field.onChange)}
                    />
                    {transactionType && (
                      <span className={cn(
                        "absolute right-3 top-1/2 -translate-y-1/2 text-sm flex items-center gap-1",
                        parseFloat(watchedAmount) > 0 ? "text-green-600" : "text-red-600"
                      )}>
                        {getTransactionTypeIcon(watchedAmount)}
                        {transactionType}
                      </span>
                    )}
                  </div>
                </FormControl>
                <FormDescription>
                  Enter positive for income, negative for expenses
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Category Selection with Smart Suggestions */}
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {formData.categories.map((category) => (
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
                {watchedDescription && suggestCategory(watchedDescription) && !field.value && (
                  <div className="text-xs text-blue-600 flex items-center gap-1 mt-1">
                    <Zap className="h-3 w-3" />
                    Smart suggestion available
                  </div>
                )}
                <FormDescription>
                  Categories will be auto-suggested based on description.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Transaction Date */}
          <FormField
            control={form.control}
            name="transactionDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Transaction Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(new Date(field.value), "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ? new Date(field.value) : undefined}
                      onSelect={(date: Date | undefined) => field.onChange(date?.toISOString())}
                      disabled={(date: Date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  When did this transaction occur?
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Description with Smart Suggestions */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="What was this transaction for?"
                    className="min-h-20"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Add details about this transaction. Categories will be auto-suggested based on description.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Receipt Upload */}
          <FormField
            control={form.control}
            name="receiptUrl"
            render={() => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Receipt (Optional)</FormLabel>
                <FormControl>
                  <div className="space-y-4">
                    {!receiptPreview ? (
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                        <div className="flex flex-col items-center gap-2 text-center">
                          <Upload className="h-8 w-8 text-muted-foreground" />
                          <div className="text-sm text-muted-foreground">
                            <label 
                              htmlFor="receipt-upload" 
                              className="font-medium text-primary cursor-pointer hover:underline"
                            >
                              Click to upload receipt
                            </label>
                            <p>PNG, JPG, PDF up to 10MB</p>
                          </div>
                          <input
                            id="receipt-upload"
                            type="file"
                            accept="image/*,.pdf"
                            onChange={handleReceiptUpload}
                            className="hidden"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Receipt uploaded</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={removeReceipt}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <Image 
                          src={receiptPreview} 
                          alt="Receipt preview" 
                          width={300}
                          height={200}
                          className="w-full max-w-xs mx-auto rounded-lg object-contain"
                        />
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormDescription>
                  Upload a receipt for this transaction
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Split Transaction Mode */}
        {showSplitMode && (
          <div className="space-y-4 border-t pt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Split Transaction</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowSplitMode(false);
                  setSplitEntries([]);
                }}
              >
                <X className="h-4 w-4 mr-1" />
                Cancel Split
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Divide this transaction across multiple categories. The total of all splits should equal the transaction amount.
            </p>
            
            {/* Split Entries */}
            <div className="space-y-3">
              {splitEntries.map((entry, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end p-3 border rounded-lg">
                  <div className="col-span-5">
                    <label className="text-sm font-medium">Category</label>
                    <Select
                      value={entry.categoryId}
                      onValueChange={(value) => updateSplitEntry(index, 'categoryId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {formData.categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            <div className="flex items-center gap-2">
                              <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: `${category.color}20` }}>
                                {category.name}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-3">
                    <label className="text-sm font-medium">Amount</label>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                      <Input
                        type="text"
                        placeholder="0.00"
                        className="pl-6"
                        value={entry.amount}
                        onChange={(e) => updateSplitEntry(index, 'amount', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-span-3">
                    <label className="text-sm font-medium">Description</label>
                    <Input
                      type="text"
                      placeholder="Details"
                      value={entry.description}
                      onChange={(e) => updateSplitEntry(index, 'description', e.target.value)}
                    />
                  </div>
                  <div className="col-span-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSplitEntry(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {/* Add Split Entry Button */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSplitEntry}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Split
              </Button>
            </div>

            {/* Split Summary */}
            {splitEntries.length > 0 && (
              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="flex justify-between items-center text-sm">
                  <span>Total Split Amount:</span>
                  <span className="font-medium">₹{calculateSplitTotal()}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span>Transaction Amount:</span>
                  <span className="font-medium">₹{Math.abs(parseFloat(form.watch('amount')) || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm mt-1 pt-1 border-t">
                  <span>Difference:</span>
                  <span className={cn(
                    "font-medium",
                    getSplitDifference() === 0 ? "text-green-600" : "text-red-600"
                  )}>
                    ₹{Math.abs(getSplitDifference()).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Transaction Templates */}
        {showTemplates && (
          <div className="space-y-4 border-t pt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Transaction Templates</h3>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={saveAsTemplate}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Save as Template
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowTemplates(false);
                  }}
                >
                  <X className="h-4 w-4 mr-1" />
                  Close
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Save frequently used transactions as templates for quick reuse.
            </p>
            
            {/* Template List */}
            <div className="grid gap-3 sm:grid-cols-2">
              {formData.templates.map((template) => (
                <div 
                  key={template.id} 
                  className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => applyTemplate(template)}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{template.name}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteTemplate(template.id);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                  <div className="flex items-center justify-between mt-2 text-sm">
                    <span>₹{template.amount}</span>
                    <span className="text-muted-foreground">
                      {formData.categories.find(c => c.id === template.categoryId)?.name}
                    </span>
                  </div>
                </div>
              ))}
              
              {formData.templates.length === 0 && (
                <div className="col-span-2 text-center p-8 text-muted-foreground">
                  <BookOpen className="h-8 w-8 mx-auto mb-2" />
                  <p>No templates saved yet</p>
                  <p className="text-sm">Fill out the form and click &quot;Save as Template&quot; to create your first template</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bulk Transaction Entry */}
        {showBulkMode && (
          <div className="space-y-4 border-t pt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Bulk Transaction Entry</h3>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addBulkEntry}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Entry
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowBulkMode(false);
                    setBulkEntries([]);
                  }}
                >
                  <X className="h-4 w-4 mr-1" />
                  Close
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Add multiple transactions at once. Each entry will be created as a separate transaction.
            </p>
            
            {/* Bulk Entries */}
            <div className="space-y-3">
              {bulkEntries.map((entry, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end p-3 border rounded-lg">
                  <div className="col-span-3">
                    <label className="text-sm font-medium">Account</label>
                    <Select
                      value={entry.accountId}
                      onValueChange={(value) => updateBulkEntry(index, 'accountId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Account" />
                      </SelectTrigger>
                      <SelectContent>
                        {formData.accounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium">Amount</label>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                      <Input
                        type="text"
                        placeholder="0.00"
                        className="pl-6"
                        value={entry.amount}
                        onChange={(e) => updateBulkEntry(index, 'amount', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-span-3">
                    <label className="text-sm font-medium">Category</label>
                    <Select
                      value={entry.categoryId}
                      onValueChange={(value) => updateBulkEntry(index, 'categoryId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {formData.categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            <div className="flex items-center gap-2">
                              <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: `${category.color}20` }}>
                                {category.name}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-3">
                    <label className="text-sm font-medium">Description</label>
                    <Input
                      type="text"
                      placeholder="Transaction details"
                      value={entry.description}
                      onChange={(e) => updateBulkEntry(index, 'description', e.target.value)}
                    />
                  </div>
                  <div className="col-span-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeBulkEntry(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {bulkEntries.length === 0 && (
                <div className="text-center p-8 text-muted-foreground border-2 border-dashed rounded-lg">
                  <Plus className="h-8 w-8 mx-auto mb-2" />
                  <p>No bulk entries yet</p>
                  <p className="text-sm">Click &quot;Add Entry&quot; to start adding multiple transactions</p>
                </div>
              )}
            </div>

            {/* Bulk Actions */}
            {bulkEntries.length > 0 && (
              <div className="flex justify-between items-center pt-4 border-t">
                <span className="text-sm text-muted-foreground">
                  {bulkEntries.length} transaction{bulkEntries.length !== 1 ? 's' : ''} ready
                </span>
                <Button
                  type="button"
                  onClick={submitBulkEntries}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Create All Transactions
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

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
            disabled={isSubmitting || !form.formState.isValid}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Add Transaction
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
          Add New Transaction
        </CardTitle>
        <CardDescription>
          Record a new income or expense transaction
        </CardDescription>
      </CardHeader>
      <CardContent>
        {content}
      </CardContent>
    </Card>
  );
}
