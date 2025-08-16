'use client';

import { useState, useEffect } from 'react';
import { type Account } from '@/lib/types/account';
import { type Category } from '@/lib/types/category';

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
        fetch('/api/accounts'),
        fetch('/api/categories'),
      ]);

      if (!accountsResponse.ok || !categoriesResponse.ok) {
        throw new Error('Failed to load form data');
      }

      const [accountsData, categoriesData] = await Promise.all([
        accountsResponse.json(),
        categoriesResponse.json(),
      ]);

      setFormData({
        accounts: accountsData.accounts || [],
        categories: categoriesData.categories || [],
      });
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
