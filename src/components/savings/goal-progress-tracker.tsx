'use client';

import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Clock, Target, AlertTriangle, CheckCircle } from 'lucide-react';
import { differenceInDays } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { GoalTimelineChart } from './goal-timeline-chart';

import type { GoalWithProgress } from '@/lib/types/savings';

interface GoalProgressTrackerProps {
  goal: GoalWithProgress;
  className?: string;
}

export function GoalProgressTracker({ goal, className }: GoalProgressTrackerProps) {
  const progressMetrics = useMemo(() => {
    const progressPercentage = (goal.currentAmount / goal.targetAmount) * 100;
    const daysRemaining = differenceInDays(new Date(goal.targetDate), new Date());
    const isOverdue = daysRemaining < 0;
    const totalDays = differenceInDays(new Date(goal.targetDate), new Date(goal.createdAt));
    const daysPassed = totalDays - daysRemaining;
    const expectedProgress = totalDays > 0 ? (daysPassed / totalDays) * 100 : 0;
    
    const progressDifference = progressPercentage - expectedProgress;
    const isAhead = progressDifference > 5; // 5% threshold
    const isBehind = progressDifference < -5;
    
    // Calculate savings rate trends
    const currentDailyRate = goal.actualDailySavings || 0;
    const requiredDailyRate = goal.requiredDailySavings;
    const rateEfficiency = requiredDailyRate > 0 ? (currentDailyRate / requiredDailyRate) * 100 : 0;
    
    // Milestone progress
    const milestones = [
      { percentage: 25, achieved: progressPercentage >= 25 },
      { percentage: 50, achieved: progressPercentage >= 50 },
      { percentage: 75, achieved: progressPercentage >= 75 },
      { percentage: 100, achieved: progressPercentage >= 100 },
    ];
    
    const nextMilestone = milestones.find(m => !m.achieved);
    const completedMilestones = milestones.filter(m => m.achieved).length;
    
    return {
      progressPercentage,
      daysRemaining,
      isOverdue,
      totalDays,
      daysPassed,
      expectedProgress,
      progressDifference,
      isAhead,
      isBehind,
      currentDailyRate,
      requiredDailyRate,
      rateEfficiency,
      milestones,
      nextMilestone,
      completedMilestones,
    };
  }, [goal]);

  const getStatusIcon = () => {
    if (progressMetrics.progressPercentage >= 100) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    if (progressMetrics.isOverdue) {
      return <AlertTriangle className="h-5 w-5 text-red-500" />;
    }
    if (progressMetrics.isAhead) {
      return <TrendingUp className="h-5 w-5 text-green-500" />;
    }
    if (progressMetrics.isBehind) {
      return <TrendingDown className="h-5 w-5 text-red-500" />;
    }
    return <Target className="h-5 w-5 text-blue-500" />;
  };

  const getStatusText = () => {
    if (progressMetrics.progressPercentage >= 100) return 'Goal Completed!';
    if (progressMetrics.isOverdue) return 'Overdue';
    if (progressMetrics.isAhead) return 'Ahead of Schedule';
    if (progressMetrics.isBehind) return 'Behind Schedule';
    return 'On Track';
  };

  const getStatusColor = () => {
    if (progressMetrics.progressPercentage >= 100) return 'bg-green-500';
    if (progressMetrics.isOverdue) return 'bg-red-500';
    if (progressMetrics.isAhead) return 'bg-green-500';
    if (progressMetrics.isBehind) return 'bg-red-500';
    return 'bg-blue-500';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon()}
              {goal.name}
            </CardTitle>
            <Badge className={`${getStatusColor()} text-white`}>
              {getStatusText()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Main Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span className="font-medium">
                {progressMetrics.progressPercentage.toFixed(1)}%
              </span>
            </div>
            <Progress 
              value={Math.min(progressMetrics.progressPercentage, 100)} 
              className="h-3"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>₹{goal.currentAmount.toLocaleString()}</span>
              <span>₹{goal.targetAmount.toLocaleString()}</span>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <Clock className="h-3 w-3" />
                <span className="text-xs">Days Left</span>
              </div>
              <p className={`text-lg font-semibold ${progressMetrics.isOverdue ? 'text-red-600' : ''}`}>
                {progressMetrics.isOverdue ? 'Overdue' : progressMetrics.daysRemaining}
              </p>
            </div>
            
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">Expected</div>
              <p className="text-lg font-semibold">
                {progressMetrics.expectedProgress.toFixed(1)}%
              </p>
            </div>
            
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">Difference</div>
              <p className={`text-lg font-semibold ${
                progressMetrics.progressDifference > 0 ? 'text-green-600' : 
                progressMetrics.progressDifference < 0 ? 'text-red-600' : 'text-gray-600'
              }`}>
                {progressMetrics.progressDifference > 0 ? '+' : ''}
                {progressMetrics.progressDifference.toFixed(1)}%
              </p>
            </div>
            
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">Remaining</div>
              <p className="text-lg font-semibold">
                ₹{(goal.targetAmount - goal.currentAmount).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Savings Rate Analysis */}
          <div className="space-y-3 pt-4 border-t">
            <h4 className="font-medium">Savings Rate</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Required Daily</span>
                  <span>₹{progressMetrics.requiredDailyRate.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Current Daily</span>
                  <span className={
                    progressMetrics.currentDailyRate >= progressMetrics.requiredDailyRate 
                      ? 'text-green-600' : 'text-red-600'
                  }>
                    ₹{progressMetrics.currentDailyRate.toFixed(0)}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Rate Efficiency</div>
                <div className="flex items-center gap-2">
                  <Progress value={Math.min(progressMetrics.rateEfficiency, 100)} className="flex-1" />
                  <span className="text-sm font-medium">
                    {progressMetrics.rateEfficiency.toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Milestone Progress */}
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Milestones</h4>
              <span className="text-sm text-muted-foreground">
                {progressMetrics.completedMilestones}/4 completed
              </span>
            </div>
            <div className="flex items-center gap-2">
              {progressMetrics.milestones.map((milestone, index) => (
                <div key={milestone.percentage} className="flex-1 text-center">
                  <div 
                    className={`w-8 h-8 rounded-full border-2 mx-auto mb-1 flex items-center justify-center text-xs font-medium ${
                      milestone.achieved 
                        ? 'bg-green-500 border-green-500 text-white' 
                        : 'border-gray-300 text-gray-400'
                    }`}
                  >
                    {milestone.percentage}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {milestone.percentage}%
                  </div>
                  {index < progressMetrics.milestones.length - 1 && (
                    <div 
                      className={`h-0.5 mt-4 ${
                        milestone.achieved ? 'bg-green-500' : 'bg-gray-300'
                      }`} 
                    />
                  )}
                </div>
              ))}
            </div>
            {progressMetrics.nextMilestone && (
              <div className="text-sm text-muted-foreground text-center">
                Next milestone: {progressMetrics.nextMilestone.percentage}% 
                (₹{((progressMetrics.nextMilestone.percentage / 100) * goal.targetAmount - goal.currentAmount).toLocaleString()} remaining)
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Timeline Chart */}
      <GoalTimelineChart goal={goal} />
    </div>
  );
}
