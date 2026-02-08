import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getSavingsGoals,
    createSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal
} from '@/lib/actions/savings-goals';
import type { GoalWithProgress } from '@/lib/types/savings';

export function useSavingsGoals() {
    return useQuery({
        queryKey: ['savings-goals'],
        queryFn: async (): Promise<GoalWithProgress[]> => {
            const data = await getSavingsGoals();
            return data.goals || [];
        },
        staleTime: 3 * 60 * 1000, // 3 minutes
    });
}

export function useCreateSavingsGoal() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (goalData: Parameters<typeof createSavingsGoal>[0]) => {
            return await createSavingsGoal(goalData);
        },
        onSuccess: () => {
            // Invalidate both savings-goals and savings-summary queries
            queryClient.invalidateQueries({ queryKey: ['savings-goals'] });
            queryClient.invalidateQueries({ queryKey: ['savings-summary'] });
        },
    });
}

export function useUpdateSavingsGoal() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Parameters<typeof updateSavingsGoal>[1] }) => {
            return await updateSavingsGoal(id, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['savings-goals'] });
            queryClient.invalidateQueries({ queryKey: ['savings-summary'] });
        },
    });
}

export function useDeleteSavingsGoal() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            return await deleteSavingsGoal(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['savings-goals'] });
            queryClient.invalidateQueries({ queryKey: ['savings-summary'] });
        },
    });
}
