'use client';

import { useQuery } from '@tanstack/react-query';
import type { Category } from '@/lib/types/category';

export function useCategories() {
    return useQuery({
        queryKey: ['categories'],
        queryFn: async (): Promise<Category[]> => {
            const response = await fetch('/api/categories');
            if (!response.ok) {
                throw new Error('Failed to fetch categories');
            }
            const data = await response.json();
            // Handle both standardized ActionResponse and direct array response
            return data.data?.categories || data.categories || [];
        },
        staleTime: 5 * 60 * 1000, // 5 minutes - categories change less frequently
    });
}
