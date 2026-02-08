import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AccountResponse } from '@/lib/types/account';

export function useAccounts() {
  return useQuery({
    queryKey: ['accounts'],
    queryFn: async (): Promise<AccountResponse[]> => {
      const response = await fetch('/api/accounts');
      if (!response.ok) {
        throw new Error('Failed to fetch accounts');
      }
      const data = await response.json();
      // Handle both standardized ActionResponse and direct response formats
      // Always return an array to prevent undefined issues
      return data.data?.accounts || data.accounts || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (accountData: unknown) => {
      const response = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(accountData),
      });

      if (!response.ok) {
        throw new Error('Failed to create account');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate accounts query to refetch
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: unknown }) => {
      const response = await fetch(`/api/accounts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update account');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/accounts/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete account');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}
