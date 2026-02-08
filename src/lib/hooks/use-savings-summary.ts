import { useQuery } from '@tanstack/react-query';
import { getSavingsGoals } from '@/lib/actions/savings-goals';
import type { GoalWithProgress, GoalMilestoneWithStatus } from '@/lib/types/savings';

export interface SavingsGoalSummary {
    activeGoalsCount: number;
    totalProgress: number;
    nextMilestone: string | null;
}

export function useSavingsSummary() {
    return useQuery({
        queryKey: ['savings-summary'],
        queryFn: async (): Promise<SavingsGoalSummary> => {
            const data = await getSavingsGoals();
            const goals: GoalWithProgress[] = data.goals || [];

            const activeGoals = goals.filter((g: GoalWithProgress) => g.status === 'active');
            const totalProgress = activeGoals.length > 0
                ? activeGoals.reduce((sum: number, g: GoalWithProgress) => sum + (g.progressPercentage || 0), 0) / activeGoals.length
                : 0;

            // Find next milestone from the most active goal
            const firstGoalMilestones = activeGoals[0]?.milestones || [];
            const nextMilestone = firstGoalMilestones.length > 0
                ? firstGoalMilestones.find((m: GoalMilestoneWithStatus) => !m.isAchieved)?.percentage?.toString() + '%' || null
                : null;

            return {
                activeGoalsCount: activeGoals.length,
                totalProgress,
                nextMilestone,
            };
        },
        staleTime: 3 * 60 * 1000, // 3 minutes
    });
}
