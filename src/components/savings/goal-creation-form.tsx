'use client';

import { useState, useEffect } from 'react';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { createSavingsGoal } from '@/lib/actions/savings-goals';
import { getUserAccounts } from '@/lib/actions/accounts';
import { getUserCategories } from '@/lib/actions/categories';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number | string;
}

interface Category {
  id: string;
  name: string;
  color: string;
}

interface GoalCreationFormProps {
  onSuccess: () => void;
}

export function GoalCreationForm({ onSuccess }: GoalCreationFormProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    targetAmount: '',
    targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    accountId: '',
    categoryId: '',
    priority: '5',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch accounts and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [accountsData, categoriesData] = await Promise.all([
          getUserAccounts(),
          getUserCategories(),
        ]);

        if (accountsData.success && accountsData.data) {
          setAccounts(accountsData.data.accounts as Account[]);
        }

        if (categoriesData.success && categoriesData.data) {
          setCategories(categoriesData.data.categories as Category[]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load form data');
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Goal name is required';
    }

    const amount = parseFloat(formData.targetAmount);
    if (!formData.targetAmount || isNaN(amount) || amount <= 0) {
      newErrors.targetAmount = 'Valid target amount is required';
    }

    if (!formData.accountId) {
      newErrors.accountId = 'Please select an account';
    }

    if (!formData.targetDate || formData.targetDate <= new Date()) {
      newErrors.targetDate = 'Target date must be in the future';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await createSavingsGoal({
        name: formData.name,
        description: formData.description || undefined,
        targetAmount: parseFloat(formData.targetAmount),
        targetDate: formData.targetDate,
        accountId: formData.accountId,
        categoryId: formData.categoryId || undefined,
        priority: parseInt(formData.priority),
      });

      toast.success('Savings goal created successfully!');
      onSuccess();
    } catch (error) {
      console.error('Error creating goal:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create goal');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading form data...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Goal Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Goal Name</Label>
        <Input
          id="name"
          placeholder="Emergency Fund"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className={errors.name ? 'border-destructive' : ''}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name}</p>
        )}
        <p className="text-sm text-muted-foreground">
          Give your savings goal a descriptive name
        </p>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          placeholder="Describe what this goal is for..."
          className="resize-none"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      {/* Target Amount */}
      <div className="space-y-2">
        <Label htmlFor="targetAmount">Target Amount</Label>
        <Input
          id="targetAmount"
          type="number"
          step="0.01"
          min="0.01"
          placeholder="5000.00"
          value={formData.targetAmount}
          onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
          className={errors.targetAmount ? 'border-destructive' : ''}
        />
        {errors.targetAmount && (
          <p className="text-sm text-destructive">{errors.targetAmount}</p>
        )}
        <p className="text-sm text-muted-foreground">
          How much do you want to save?
        </p>
      </div>

      {/* Target Date */}
      <div className="space-y-2">
        <Label>Target Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full pl-3 text-left font-normal",
                !formData.targetDate && "text-muted-foreground",
                errors.targetDate && "border-destructive"
              )}
            >
              {formData.targetDate ? (
                format(formData.targetDate, "PPP")
              ) : (
                <span>Pick a date</span>
              )}
              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={formData.targetDate}
              onSelect={(date) => date && setFormData({ ...formData, targetDate: date })}
              disabled={(date) => date < new Date() || date < new Date("1900-01-01")}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {errors.targetDate && (
          <p className="text-sm text-destructive">{errors.targetDate}</p>
        )}
        <p className="text-sm text-muted-foreground">
          When do you want to reach this goal?
        </p>
      </div>

      {/* Account Selection */}
      <div className="space-y-2">
        <Label htmlFor="accountId">Savings Account</Label>
        <Select
          value={formData.accountId}
          onValueChange={(value) => setFormData({ ...formData, accountId: value })}
        >
          <SelectTrigger className={errors.accountId ? 'border-destructive' : ''}>
            <SelectValue placeholder="Select an account" />
          </SelectTrigger>
          <SelectContent>
            {accounts.map((account) => (
              <SelectItem key={account.id} value={account.id}>
                {account.name} - ₹{Number(account.balance).toLocaleString()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.accountId && (
          <p className="text-sm text-destructive">{errors.accountId}</p>
        )}
        <p className="text-sm text-muted-foreground">
          Which account will you use to save for this goal?
        </p>
      </div>

      {/* Category Selection */}
      <div className="space-y-2">
        <Label htmlFor="categoryId">Category (Optional)</Label>
        <Select
          value={formData.categoryId}
          onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  {category.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          Categorize your goal for better organization
        </p>
      </div>

      {/* Priority */}
      <div className="space-y-2">
        <Label htmlFor="priority">Priority (1-10)</Label>
        <Input
          id="priority"
          type="number"
          min="1"
          max="10"
          value={formData.priority}
          onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
        />
        <p className="text-sm text-muted-foreground">
          1 = Low priority, 10 = High priority
        </p>
      </div>

      {/* Submit Button */}
      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Goal...
            </>
          ) : (
            'Create Goal'
          )}
        </Button>
      </div>
    </form>
  );
}
