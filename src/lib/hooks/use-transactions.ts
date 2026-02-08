'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Transaction } from '@/lib/types/transaction';

interface TransactionFilters {
    accountId?: string;
    categoryId?: string;
    type?: 'income' | 'expense' | 'all';
    limit?: number;
}

interface TransactionsResponse {
    transactions: Transaction[];
    total?: number;
}

export function useTransactions(filters: TransactionFilters = {}) {
    const { accountId, categoryId, type, limit = 50 } = filters;

    return useQuery({
        queryKey: ['transactions', { accountId, categoryId, type, limit }],
        queryFn: async (): Promise<TransactionsResponse> => {
            const params = new URLSearchParams();
            if (accountId && accountId !== 'all') params.set('accountId', accountId);
            if (categoryId && categoryId !== 'all') params.set('categoryId', categoryId);
            if (type && type !== 'all') params.set('type', type);
            params.set('limit', limit.toString());

            const response = await fetch(`/api/transactions?${params}`);
            if (!response.ok) {
                throw new Error('Failed to fetch transactions');
            }
            return response.json();
        },
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
}

export function useCreateTransaction() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (transactionData: unknown) => {
            const response = await fetch('/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(transactionData),
            });

            if (!response.ok) {
                throw new Error('Failed to create transaction');
            }

            return response.json();
        },
        onSuccess: () => {
            // Invalidate all transaction queries to refetch
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            // Also invalidate accounts as balances may have changed
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
        },
    });
}

export function useUpdateTransaction() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: unknown }) => {
            const response = await fetch(`/api/transactions/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error('Failed to update transaction');
            }

            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
        },
    });
}

export function useDeleteTransaction() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const response = await fetch(`/api/transactions/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete transaction');
            }

            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
        },
    });
}
