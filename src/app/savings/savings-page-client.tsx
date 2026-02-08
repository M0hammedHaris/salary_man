'use client';

import { SavingsGoalsDashboard } from '@/components/savings/savings-goals-dashboard';
import { useSavingsGoals, useUpdateSavingsGoal } from '@/lib/hooks/use-savings-goals';
import { useQueryClient } from '@tanstack/react-query';
import type { GoalWithProgress } from '@/lib/types/savings';

interface SavingsPageClientProps {
    initialGoals: GoalWithProgress[];
}

export function SavingsPageClient({ initialGoals }: SavingsPageClientProps) {
    const queryClient = useQueryClient();

    // Use React Query for cached data - initialGoals serves as fallback
    const { data: goals = initialGoals } = useSavingsGoals();
    const updateGoalMutation = useUpdateSavingsGoal();

    // Invalidate queries to trigger refetch
    const refreshGoals = () => {
        queryClient.invalidateQueries({ queryKey: ['savings-goals'] });
        queryClient.invalidateQueries({ queryKey: ['savings-summary'] });
    };

    const handleGoalCreated = () => {
        refreshGoals();
    };

    const handleGoalUpdated = () => {
        refreshGoals();
    };

    const handleGoalDeleted = () => {
        refreshGoals();
    };

    const handleGoalPriorityUpdated = async (goalId: string, newPriority: number) => {
        try {
            await updateGoalMutation.mutateAsync({
                id: goalId,
                data: { priority: newPriority }
            });
        } catch (error) {
            console.error('Error updating goal priority:', error);
            refreshGoals();
        }
    };

    return (
        <SavingsGoalsDashboard
            goals={goals}
            onGoalCreated={handleGoalCreated}
            onGoalUpdated={handleGoalUpdated}
            onGoalDeleted={handleGoalDeleted}
            onGoalPriorityUpdated={handleGoalPriorityUpdated}
        />
    );
}

