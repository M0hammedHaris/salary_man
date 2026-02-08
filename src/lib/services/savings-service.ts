import { db } from '@/lib/db';
import Decimal from 'decimal.js';
import { 
  savingsGoals, 
  goalMilestones, 
  goalProgressHistory, 
  accounts, 
  type SavingsGoal,
  type NewSavingsGoal,
} from '@/lib/db/schema';
import {
  type GoalWithProgress,
  type GoalAnalytics,
  type TimelineProjection,
  type ProgressCalculation,
  type SavingsRateCalculation,
  type ProjectionDataPoint,
} from '@/lib/types/savings';
import { and, eq, desc, asc, sql, lte } from 'drizzle-orm';
import { differenceInDays, addDays } from 'date-fns';

export class SavingsService {
  /**
   * Create a new savings goal
   */
  async createGoal(userId: string, goalData: Omit<NewSavingsGoal, 'userId' | 'currentAmount' | 'initialBalance'>): Promise<SavingsGoal> {
    // Get current account balance to set as initial balance
    const account = await db.query.accounts.findFirst({
      where: and(
        eq(accounts.id, goalData.accountId),
        eq(accounts.userId, userId)
      ),
    });

    if (!account) {
      throw new Error('Account not found');
    }

    const [goal] = await db.insert(savingsGoals).values({
      ...goalData,
      userId,
      currentAmount: account.balance,
      initialBalance: account.balance,
    }).returning();

    // Create default milestones (25%, 50%, 75%, 100%)
    const milestonePercentages = [25, 50, 75, 100];
    const milestoneData = milestonePercentages.map(percentage => {
      const targetAmountDecimal = new Decimal(goalData.targetAmount);
      const milestoneAmount = targetAmountDecimal.mul(percentage).div(100);
      return {
        goalId: goal.id,
        userId,
        milestonePercentage: percentage.toString(),
        targetAmount: milestoneAmount.toString(),
      };
    });

    await db.insert(goalMilestones).values(milestoneData);

    return goal;
  }

  /**
   * Get all goals for a user with progress information
   */
  async getUserGoals(userId: string): Promise<GoalWithProgress[]> {
    const goalsWithDetails = await db.query.savingsGoals.findMany({
      where: eq(savingsGoals.userId, userId),
      with: {
        account: {
          columns: { name: true },
        },
        category: {
          columns: { name: true, color: true },
        },
        milestones: true,
      },
      orderBy: [desc(savingsGoals.priority), desc(savingsGoals.createdAt)],
    });

    return Promise.all(
      goalsWithDetails.map(async (goal) => {
        const currentAmount = new Decimal(goal.currentAmount);
        const targetAmount = new Decimal(goal.targetAmount);
        const progressData = this.calculateProgress(goal.id, currentAmount.toNumber(), targetAmount.toNumber());
        const savingsRate = await this.calculateSavingsRate(goal.id);
        const remainingAmount = targetAmount.minus(currentAmount);
        
        return {
          id: goal.id,
          name: goal.name,
          description: goal.description ?? undefined,
          targetAmount: targetAmount.toNumber(),
          currentAmount: currentAmount.toNumber(),
          targetDate: goal.targetDate,
          status: goal.status,
          priority: parseInt(goal.priority),
          accountName: goal.account.name,
          categoryName: goal.category?.name,
          categoryColor: goal.category?.color,
          progressPercentage: progressData.progressPercentage,
          remainingAmount: remainingAmount.toNumber(),
          daysRemaining: differenceInDays(goal.targetDate, new Date()),
          isOnTrack: this.isGoalOnTrack(
            currentAmount.toNumber(),
            targetAmount.toNumber(),
            goal.targetDate,
            savingsRate.dailyRate
          ),
          requiredDailySavings: this.calculateRequiredDailySavings(
            currentAmount.toNumber(),
            targetAmount.toNumber(),
            goal.targetDate
          ),
          actualDailySavings: savingsRate.dailyRate,
          milestones: goal.milestones.map(m => {
            const milestoneTarget = new Decimal(m.targetAmount);
            const milestoneAchieved = m.achievedAmount ? new Decimal(m.achievedAmount) : undefined;
            return {
              id: m.id,
              percentage: parseFloat(m.milestonePercentage),
              targetAmount: milestoneTarget.toNumber(),
              achievedAmount: milestoneAchieved?.toNumber(),
              achievedAt: m.achievedAt ?? undefined,
              isAchieved: m.isAchieved,
              notified: m.notified,
            };
          }),
          createdAt: goal.createdAt,
          updatedAt: goal.updatedAt,
        };
      })
    );
  }

  /**
   * Update goal progress based on account balance changes
   */
  async updateGoalProgress(goalId: string, userId: string, transactionId?: string): Promise<ProgressCalculation> {
    const goal = await db.query.savingsGoals.findFirst({
      where: and(eq(savingsGoals.id, goalId), eq(savingsGoals.userId, userId)),
      with: { account: true },
    });

    if (!goal) {
      throw new Error('Goal not found');
    }

    const previousAmount = new Decimal(goal.currentAmount);
    const newAmount = new Decimal(goal.account.balance);
    const changeAmount = newAmount.minus(previousAmount);

    // Update goal current amount
    await db.update(savingsGoals)
      .set({ 
        currentAmount: goal.account.balance,
        updatedAt: new Date(),
      })
      .where(eq(savingsGoals.id, goalId));

    // Record progress history
    const targetAmount = new Decimal(goal.targetAmount);
    const progressData = this.calculateProgress(goalId, newAmount.toNumber(), targetAmount.toNumber());
    
    await db.insert(goalProgressHistory).values({
      goalId,
      userId,
      previousAmount: previousAmount.toString(),
      newAmount: newAmount.toString(),
      changeAmount: changeAmount.toString(),
      accountBalance: goal.account.balance,
      progressPercentage: progressData.progressPercentage.toString(),
      transactionId,
    });

    // Check for milestone achievements
    const milestoneTriggered = await this.checkMilestoneAchievements(goalId, newAmount.toNumber(), targetAmount.toNumber());

    return {
      previousAmount: previousAmount.toNumber(),
      newAmount: newAmount.toNumber(),
      changeAmount: changeAmount.toNumber(),
      progressPercentage: progressData.progressPercentage,
      milestoneTriggered,
    };
  }

  /**
   * Calculate goal analytics for the user
   */
  async getGoalAnalytics(userId: string): Promise<GoalAnalytics> {
    const goals = await db.query.savingsGoals.findMany({
      where: eq(savingsGoals.userId, userId),
    });

    const totalGoals = goals.length;
    const activeGoals = goals.filter(g => g.status === 'active').length;
    const completedGoals = goals.filter(g => g.status === 'completed').length;
    
    const totalTargetAmount = goals.reduce((sum, g) => 
      sum.plus(new Decimal(g.targetAmount)), new Decimal(0)
    );
    const totalCurrentAmount = goals.reduce((sum, g) => 
      sum.plus(new Decimal(g.currentAmount)), new Decimal(0)
    );
    const averageProgress = totalTargetAmount.greaterThan(0) 
      ? totalCurrentAmount.div(totalTargetAmount).mul(100).toNumber() 
      : 0;

    // Calculate on-track vs behind goals
    let onTrackGoals = 0;
    let behindGoals = 0;
    const aheadGoals = 0;

    for (const goal of goals.filter(g => g.status === 'active')) {
      const savingsRate = await this.calculateSavingsRate(goal.id);
      const currentAmount = new Decimal(goal.currentAmount);
      const targetAmount = new Decimal(goal.targetAmount);
      const isOnTrack = this.isGoalOnTrack(
        currentAmount.toNumber(),
        targetAmount.toNumber(),
        goal.targetDate,
        savingsRate.dailyRate
      );
      
      if (isOnTrack) onTrackGoals++;
      else behindGoals++;
    }

    // Get upcoming milestones
    const upcomingMilestones = await db.query.goalMilestones.findMany({
      where: and(
        eq(goalMilestones.userId, userId),
        eq(goalMilestones.isAchieved, false)
      ),
      with: { goal: true },
      orderBy: asc(goalMilestones.milestonePercentage),
      limit: 5,
    });

    // Get recent achievements
    const recentAchievements = await db.query.goalMilestones.findMany({
      where: and(
        eq(goalMilestones.userId, userId),
        eq(goalMilestones.isAchieved, true)
      ),
      orderBy: desc(goalMilestones.achievedAt),
      limit: 5,
    });

    return {
      totalGoals,
      activeGoals,
      completedGoals,
      totalTargetAmount: totalTargetAmount.toNumber(),
      totalCurrentAmount: totalCurrentAmount.toNumber(),
      averageProgress,
      onTrackGoals,
      behindGoals,
      aheadGoals,
      upcomingMilestones: upcomingMilestones.map(m => {
        const targetAmount = new Decimal(m.targetAmount);
        return {
          id: m.id,
          percentage: parseFloat(m.milestonePercentage),
          targetAmount: targetAmount.toNumber(),
          achievedAmount: undefined,
          achievedAt: undefined,
          isAchieved: false,
          notified: false,
        };
      }),
      recentAchievements: recentAchievements.map(m => {
        const targetAmount = new Decimal(m.targetAmount);
        const achievedAmount = m.achievedAmount ? new Decimal(m.achievedAmount) : undefined;
        return {
          id: m.id,
          percentage: parseFloat(m.milestonePercentage),
          targetAmount: targetAmount.toNumber(),
          achievedAmount: achievedAmount?.toNumber(),
          achievedAt: m.achievedAt ?? undefined,
          isAchieved: true,
          notified: m.notified,
        };
      }),
    };
  }

  /**
   * Update an existing goal
   */
  async updateGoal(goalId: string, userId: string, updates: Partial<NewSavingsGoal>): Promise<SavingsGoal> {
    const [updatedGoal] = await db.update(savingsGoals)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(savingsGoals.id, goalId), eq(savingsGoals.userId, userId)))
      .returning();

    if (!updatedGoal) {
      throw new Error('Goal not found');
    }

    // If target amount changed, update milestones
    if (updates.targetAmount) {
      const targetAmountDecimal = new Decimal(updates.targetAmount);
      const milestonePercentages = [25, 50, 75, 100];
      for (const percentage of milestonePercentages) {
        const milestoneAmount = targetAmountDecimal.mul(percentage).div(100);
        await db.update(goalMilestones)
          .set({
            targetAmount: milestoneAmount.toString(),
          })
          .where(and(
            eq(goalMilestones.goalId, goalId),
            eq(goalMilestones.milestonePercentage, percentage.toString())
          ));
      }
    }

    return updatedGoal;
  }

  /**
   * Delete a goal and its related data
   */
  async deleteGoal(goalId: string, userId: string): Promise<void> {
    const goal = await db.query.savingsGoals.findFirst({
      where: and(eq(savingsGoals.id, goalId), eq(savingsGoals.userId, userId)),
    });

    if (!goal) {
      throw new Error('Goal not found');
    }

    await db.delete(savingsGoals).where(eq(savingsGoals.id, goalId));
  }

  /**
   * Get timeline projection for a goal
   */
  async getTimelineProjection(goalId: string, userId: string): Promise<TimelineProjection> {
    const goal = await db.query.savingsGoals.findFirst({
      where: and(eq(savingsGoals.id, goalId), eq(savingsGoals.userId, userId)),
    });

    if (!goal) {
      throw new Error('Goal not found');
    }

    const savingsRate = await this.calculateSavingsRate(goalId);
    const currentAmount = new Decimal(goal.currentAmount);
    const targetAmount = new Decimal(goal.targetAmount);
    const remainingAmount = targetAmount.minus(currentAmount);
    
    const daysToComplete = savingsRate.dailyRate > 0 
      ? Math.ceil(remainingAmount.div(savingsRate.dailyRate).toNumber()) 
      : Infinity;
    const projectedCompletionDate = addDays(new Date(), daysToComplete);
    const varianceInDays = differenceInDays(projectedCompletionDate, goal.targetDate);
    const isOnTrack = varianceInDays <= 0;

    // Generate projection data points
    const projectionData: ProjectionDataPoint[] = [];
    const monthsToTarget = Math.ceil(differenceInDays(goal.targetDate, new Date()) / 30);
    
    for (let i = 0; i <= monthsToTarget; i++) {
      const projectionDate = addDays(new Date(), i * 30);
      const projectedAmount = Math.min(
        currentAmount.plus(new Decimal(savingsRate.dailyRate).mul(i * 30)).toNumber(),
        targetAmount.toNumber()
      );
      
      projectionData.push({
        date: projectionDate,
        projectedAmount,
        monthlyTarget: targetAmount.div(monthsToTarget).mul(i + 1).toNumber(),
      });
    }

    return {
      goalId,
      currentAmount: currentAmount.toNumber(),
      targetAmount: targetAmount.toNumber(),
      targetDate: goal.targetDate,
      projectedCompletionDate,
      averageMonthlySavings: savingsRate.monthlyRate,
      requiredMonthlySavings: this.calculateRequiredMonthlySavings(
        currentAmount.toNumber(), 
        targetAmount.toNumber(), 
        goal.targetDate
      ),
      isOnTrack,
      varianceInDays,
      confidenceLevel: this.calculateConfidenceLevel(savingsRate),
      projectionData,
    };
  }

  // Private helper methods

  private calculateProgress(goalId: string, currentAmount: number, targetAmount: number): ProgressCalculation {
    const current = new Decimal(currentAmount);
    const target = new Decimal(targetAmount);
    const progressPercentage = target.greaterThan(0) 
      ? current.div(target).mul(100).toNumber() 
      : 0;
    
    return {
      previousAmount: 0, // This will be set by the caller
      newAmount: currentAmount,
      changeAmount: 0, // This will be set by the caller
      progressPercentage: Math.min(progressPercentage, 100),
    };
  }

  private async calculateSavingsRate(goalId: string): Promise<SavingsRateCalculation> {
    const progressHistory = await db.query.goalProgressHistory.findMany({
      where: eq(goalProgressHistory.goalId, goalId),
      orderBy: desc(goalProgressHistory.recordedAt),
      limit: 30, // Last 30 entries
    });

    if (progressHistory.length < 2) {
      return {
        dailyRate: 0,
        weeklyRate: 0,
        monthlyRate: 0,
        averageRate: 0,
        trendDirection: 'stable',
      };
    }

    const changes = progressHistory.map(h => new Decimal(h.changeAmount));
    const totalChange = changes.reduce((sum, change) => sum.plus(change), new Decimal(0));
    const days = differenceInDays(progressHistory[0].recordedAt, progressHistory[progressHistory.length - 1].recordedAt) || 1;
    
    const dailyRate = totalChange.div(days).toNumber();
    const weeklyRate = dailyRate * 7;
    const monthlyRate = dailyRate * 30;
    const averageRate = totalChange.div(progressHistory.length).toNumber();

    // Calculate trend
    const recentChanges = changes.slice(0, 5);
    const olderChanges = changes.slice(-5);
    const recentAvg = recentChanges.reduce((sum, c) => sum.plus(c), new Decimal(0))
      .div(recentChanges.length).toNumber();
    const olderAvg = olderChanges.reduce((sum, c) => sum.plus(c), new Decimal(0))
      .div(olderChanges.length).toNumber();
    
    let trendDirection: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (recentAvg > olderAvg * 1.1) trendDirection = 'increasing';
    else if (recentAvg < olderAvg * 0.9) trendDirection = 'decreasing';

    return {
      dailyRate,
      weeklyRate,
      monthlyRate,
      averageRate,
      trendDirection,
    };
  }

  private isGoalOnTrack(currentAmount: number, targetAmount: number, targetDate: Date, dailyRate: number): boolean {
    const remainingAmount = new Decimal(targetAmount).minus(currentAmount);
    const daysRemaining = differenceInDays(targetDate, new Date());
    const requiredDailyRate = remainingAmount.div(Math.max(daysRemaining, 1)).toNumber();
    
    return dailyRate >= requiredDailyRate;
  }

  private calculateRequiredDailySavings(currentAmount: number, targetAmount: number, targetDate: Date): number {
    const remainingAmount = new Decimal(targetAmount).minus(currentAmount);
    const daysRemaining = Math.max(differenceInDays(targetDate, new Date()), 1);
    
    return remainingAmount.div(daysRemaining).toNumber();
  }

  private calculateRequiredMonthlySavings(currentAmount: number, targetAmount: number, targetDate: Date): number {
    return this.calculateRequiredDailySavings(currentAmount, targetAmount, targetDate) * 30;
  }

  private calculateConfidenceLevel(savingsRate: SavingsRateCalculation): number {
    // Base confidence on trend direction and consistency
    let confidence = 50; // Base 50%
    
    if (savingsRate.trendDirection === 'increasing') confidence += 30;
    else if (savingsRate.trendDirection === 'decreasing') confidence -= 20;
    
    // Adjust based on average vs current rate consistency
    const consistency = Math.abs(savingsRate.dailyRate - savingsRate.averageRate) / Math.max(savingsRate.averageRate, 1);
    confidence += (1 - consistency) * 20;
    
    return Math.max(0, Math.min(100, confidence));
  }

  private async checkMilestoneAchievements(goalId: string, currentAmount: number, targetAmount: number): Promise<number | undefined> {
    const current = new Decimal(currentAmount);
    const target = new Decimal(targetAmount);
    const currentProgress = current.div(target).mul(100).toNumber();
    
    // Find unachieved milestones that should now be achieved
    const unachievedMilestones = await db.query.goalMilestones.findMany({
      where: and(
        eq(goalMilestones.goalId, goalId),
        eq(goalMilestones.isAchieved, false),
        lte(sql`CAST(${goalMilestones.milestonePercentage} AS NUMERIC)`, currentProgress)
      ),
      orderBy: asc(goalMilestones.milestonePercentage),
    });

    if (unachievedMilestones.length > 0) {
      const milestone = unachievedMilestones[0];
      
      // Mark milestone as achieved
      await db.update(goalMilestones)
        .set({
          isAchieved: true,
          achievedAmount: current.toString(),
          achievedAt: new Date(),
        })
        .where(eq(goalMilestones.id, milestone.id));

      return parseFloat(milestone.milestonePercentage);
    }

    return undefined;
  }
}

export const savingsService = new SavingsService();
