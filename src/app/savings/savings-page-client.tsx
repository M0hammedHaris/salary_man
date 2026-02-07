'use client';

import { useState } from 'react';
import { SavingsGoalsDashboard } from '@/components/savings/savings-goals-dashboard';
import { updateSavingsGoal } from '@/lib/actions/savings-goals';
import type { GoalWithProgress } from '@/lib/types/savings';

interface SavingsPageClientProps {
    initialGoals: GoalWithProgress[];
}

export function SavingsPageClient({ initialGoals }: SavingsPageClientProps) {
    const [goals, setGoals] = useState<GoalWithProgress[]>(initialGoals);

    const refreshGoals = async () => {
        // We can either refetch here or use a pattern like router.refresh() 
        // if we want to stick to Server Component data fetching.
        // For now, let's keep a refresh function to update local state if needed,
        // or just rely on Server Action revalidation + router.refresh().
        const { getSavingsGoals } = await import('@/lib/actions/savings-goals');
        const data = await getSavingsGoals();
        setGoals(data.goals || []);
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
            await updateSavingsGoal(goalId, { priority: newPriority });

            // Update local state optimistically
            setGoals(prevGoals =>
                prevGoals.map(goal =>
                    goal.id === goalId
                        ? { ...goal, priority: newPriority }
                        : goal
                )
            );
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
