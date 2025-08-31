import { z } from 'zod';

// Validation schemas
export const createGoalSchema = z.object({
  name: z.string().min(1, 'Goal name is required').max(100, 'Goal name must be under 100 characters'),
  description: z.string().optional(),
  targetAmount: z.number().min(0.01, 'Target amount must be greater than 0'),
  targetDate: z.date().min(new Date(), 'Target date must be in the future'),
  accountId: z.string().uuid('Invalid account ID'),
  categoryId: z.string().uuid('Invalid category ID').optional(),
  priority: z.number().int().min(1).max(10).default(5),
});

export const updateGoalSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  targetAmount: z.number().min(0.01).optional(),
  targetDate: z.date().min(new Date()).optional(),
  categoryId: z.string().uuid().optional(),
  priority: z.number().int().min(1).max(10).optional(),
  status: z.enum(['active', 'paused', 'completed', 'cancelled']).optional(),
});

export const goalProgressSchema = z.object({
  goalId: z.string().uuid(),
  newAmount: z.number().min(0),
  transactionId: z.string().uuid().optional(),
});

// Frontend display types
export interface GoalWithProgress {
  id: string;
  name: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: Date;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  priority: number;
  accountName: string;
  categoryName?: string;
  categoryColor?: string;
  progressPercentage: number;
  remainingAmount: number;
  daysRemaining: number;
  isOnTrack: boolean;
  requiredDailySavings: number;
  actualDailySavings: number;
  milestones: GoalMilestoneWithStatus[];
  createdAt: Date;
  updatedAt: Date;
}

export interface GoalMilestoneWithStatus {
  id: string;
  percentage: number;
  targetAmount: number;
  achievedAmount?: number;
  achievedAt?: Date;
  isAchieved: boolean;
  notified: boolean;
}

export interface GoalProgressPoint {
  date: Date;
  amount: number;
  progressPercentage: number;
  changeAmount: number;
}

export interface GoalAnalytics {
  totalGoals: number;
  activeGoals: number;
  completedGoals: number;
  totalTargetAmount: number;
  totalCurrentAmount: number;
  averageProgress: number;
  onTrackGoals: number;
  behindGoals: number;
  aheadGoals: number;
  upcomingMilestones: GoalMilestoneWithStatus[];
  recentAchievements: GoalMilestoneWithStatus[];
}

export interface ResourceAllocation {
  totalMonthlyIncome: number;
  totalMonthlyExpenses: number;
  availableForSavings: number;
  currentGoalAllocations: GoalAllocation[];
  recommendations: AllocationRecommendation[];
  conflicts: AllocationConflict[];
}

export interface GoalAllocation {
  goalId: string;
  goalName: string;
  currentAllocation: number;
  recommendedAllocation: number;
  priority: number;
}

export interface AllocationRecommendation {
  type: 'increase' | 'decrease' | 'redistribute';
  goalId: string;
  goalName: string;
  currentAmount: number;
  recommendedAmount: number;
  reason: string;
  impact: string;
}

export interface AllocationConflict {
  type: 'insufficient_funds' | 'unrealistic_timeline' | 'competing_priorities';
  affectedGoals: string[];
  description: string;
  severity: 'low' | 'medium' | 'high';
  suggestions: string[];
}

export interface TimelineProjection {
  goalId: string;
  currentAmount: number;
  targetAmount: number;
  targetDate: Date;
  projectedCompletionDate: Date;
  averageMonthlySavings: number;
  requiredMonthlySavings: number;
  isOnTrack: boolean;
  varianceInDays: number;
  confidenceLevel: number;
  projectionData: ProjectionDataPoint[];
}

export interface ProjectionDataPoint {
  date: Date;
  projectedAmount: number;
  actualAmount?: number;
  monthlyTarget: number;
}

// API response types
export type CreateGoalRequest = z.infer<typeof createGoalSchema>;
export type UpdateGoalRequest = z.infer<typeof updateGoalSchema>;
export type GoalProgressRequest = z.infer<typeof goalProgressSchema>;

export interface GoalsListResponse {
  goals: GoalWithProgress[];
  analytics: GoalAnalytics;
}

export interface GoalProgressResponse {
  goal: GoalWithProgress;
  progressHistory: GoalProgressPoint[];
  projection: TimelineProjection;
}

export interface GoalMilestoneResponse {
  milestone: GoalMilestoneWithStatus;
  celebrationMessage: string;
  nextMilestone?: GoalMilestoneWithStatus;
}

// Utility types for calculations
export interface ProgressCalculation {
  previousAmount: number;
  newAmount: number;
  changeAmount: number;
  progressPercentage: number;
  milestoneTriggered?: number; // percentage if milestone was triggered
}

export interface SavingsRateCalculation {
  dailyRate: number;
  weeklyRate: number;
  monthlyRate: number;
  averageRate: number;
  trendDirection: 'increasing' | 'decreasing' | 'stable';
}
