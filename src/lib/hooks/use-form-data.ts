'use client';

import { useState, useEffect } from 'react';
import { type Account } from '@/lib/types/account';
import { type Category } from '@/lib/types/category';
import { getUserAccounts } from '@/lib/actions/accounts';
import { getUserCategories } from '@/lib/actions/categories';

export interface FormData {
  accounts: Account[];
  categories: Category[];
}

export interface UseFormDataReturn {
  formData: FormData;
  isLoading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export function useFormData(): UseFormDataReturn {
  const [formData, setFormData] = useState<FormData>({
    accounts: [],
    categories: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFormData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [accountsResponse, categoriesResponse] = await Promise.all([
        getUserAccounts(),
        getUserCategories(),
      ]);

      // Handle new response format
      const accounts = accountsResponse.success && accountsResponse.data 
        ? (accountsResponse.data.accounts as Account[])
        : [];
      
      const categories = categoriesResponse.success && categoriesResponse.data
        ? (categoriesResponse.data.categories as Category[])
        : [];

      setFormData({
        accounts,
        categories,
      });

      // Set error if either request failed
      if (!accountsResponse.success) {
        setError(accountsResponse.error);
      } else if (!categoriesResponse.success) {
        setError(categoriesResponse.error);
      }
    } catch (err) {
      console.error('Error loading form data:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load accounts and categories. Please refresh the page.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFormData();
  }, []);

  return {
    formData,
    isLoading,
    error,
    reload: loadFormData,
  };
}
