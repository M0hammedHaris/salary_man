'use client';

import { useMemo } from 'react';
import { TrendingUp, Target, DollarSign, Clock, Award } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

import type { GoalWithProgress } from '@/lib/types/savings';

interface GoalAnalyticsProps {
  goals: GoalWithProgress[];
}

export function GoalAnalytics({ goals }: GoalAnalyticsProps) {
  const analytics = useMemo(() => {
    const activeGoals = goals.filter(g => g.status === 'active');
    const completedGoals = goals.filter(g => g.status === 'completed');
    const pausedGoals = goals.filter(g => g.status === 'paused');
    
    const totalTargetAmount = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
    const totalCurrentAmount = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);
    const totalRemainingAmount = totalTargetAmount - totalCurrentAmount;
    
    const overallProgress = totalTargetAmount > 0 ? (totalCurrentAmount / totalTargetAmount) * 100 : 0;
    
    // Calculate average daily savings needed across all active goals
    const avgDailySavingsNeeded = activeGoals.length > 0 
      ? activeGoals.reduce((sum, goal) => sum + goal.requiredDailySavings, 0) / activeGoals.length
      : 0;
    
    // Goals on track vs behind
    const onTrackGoals = activeGoals.filter(g => g.isOnTrack).length;
    const behindGoals = activeGoals.filter(g => !g.isOnTrack).length;
    
    // Upcoming milestones (achievements left to reach)
    const upcomingMilestones = goals.flatMap(goal => 
      goal.milestones?.filter(milestone => !milestone.isAchieved) || []
    );
    
    // High priority goals
    const highPriorityGoals = activeGoals.filter(g => g.priority >= 8);
    
    return {
      totalGoals: goals.length,
      activeGoals: activeGoals.length,
      completedGoals: completedGoals.length,
      pausedGoals: pausedGoals.length,
      totalTargetAmount,
      totalCurrentAmount,
      totalRemainingAmount,
      overallProgress,
      avgDailySavingsNeeded,
      onTrackGoals,
      behindGoals,
      upcomingMilestones: upcomingMilestones.length,
      highPriorityGoals: highPriorityGoals.length,
    };
  }, [goals]);

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Overall Savings Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Total Progress</span>
              <span className="font-medium">
                ₹{analytics.totalCurrentAmount.toLocaleString()} / ₹{analytics.totalTargetAmount.toLocaleString()}
              </span>
            </div>
            <Progress 
              value={analytics.overallProgress} 
              className="h-3"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{analytics.overallProgress.toFixed(1)}% complete</span>
              <span>₹{analytics.totalRemainingAmount.toLocaleString()} remaining</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{analytics.totalGoals}</p>
                <p className="text-xs text-muted-foreground">Total Goals</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{analytics.completedGoals}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{analytics.activeGoals}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{analytics.highPriorityGoals}</p>
                <p className="text-xs text-muted-foreground">High Priority</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Insights */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Goal Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">On Track</span>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  {analytics.onTrackGoals} goals
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Behind Schedule</span>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                  {analytics.behindGoals} goals
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Paused</span>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                  {analytics.pausedGoals} goals
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Savings Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Avg. Daily Savings Needed</span>
                <span className="font-medium">₹{analytics.avgDailySavingsNeeded.toFixed(0)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Average amount to save daily across active goals
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Pending Milestones</span>
                <Badge variant="outline">
                  {analytics.upcomingMilestones} remaining
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Milestones yet to be achieved across all goals
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.behindGoals > 0 && (
              <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium text-red-900">
                    {analytics.behindGoals} goal{analytics.behindGoals > 1 ? 's' : ''} behind schedule
                  </p>
                  <p className="text-xs text-red-700">
                    Consider increasing your savings rate or adjusting target dates
                  </p>
                </div>
              </div>
            )}
            
            {analytics.upcomingMilestones > 0 && (
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    {analytics.upcomingMilestones} milestone{analytics.upcomingMilestones > 1 ? 's' : ''} to achieve
                  </p>
                  <p className="text-xs text-blue-700">
                    Keep saving to unlock your next milestones!
                  </p>
                </div>
              </div>
            )}
            
            {analytics.pausedGoals > 0 && (
              <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium text-yellow-900">
                    {analytics.pausedGoals} paused goal{analytics.pausedGoals > 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-yellow-700">
                    Consider resuming these goals when your budget allows
                  </p>
                </div>
              </div>
            )}
            
            {analytics.overallProgress >= 80 && (
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium text-green-900">
                    Excellent progress! You&apos;re doing great
                  </p>
                  <p className="text-xs text-green-700">
                    You&apos;re on track to achieve your savings goals
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
