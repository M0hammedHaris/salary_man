'use client';

import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Target, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GoalWithProgress } from '@/lib/types/savings';

interface GoalProgressBarsProps {
  goal: GoalWithProgress;
  className?: string;
}

export function GoalProgressBars({ goal, className }: GoalProgressBarsProps) {
  const progressPercentage = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
  const isCompleted = progressPercentage >= 100;
  const isNearlyComplete = progressPercentage >= 90;
  const isOnTrack = progressPercentage >= 75;

  // Calculate days remaining
  const targetDate = new Date(goal.targetDate);
  const today = new Date();
  const daysRemaining = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const isOverdue = daysRemaining <= 0 && !isCompleted;

  // Determine progress status
  const getProgressStatus = () => {
    if (isCompleted) return 'completed';
    if (isOverdue) return 'overdue';
    if (isNearlyComplete) return 'nearly-complete';
    if (isOnTrack) return 'on-track';
    return 'behind';
  };

  const status = getProgressStatus();

  // Get status colors and labels
  const statusConfig = {
    completed: {
      color: 'bg-green-500',
      badgeVariant: 'default' as const,
      badgeClass: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      icon: Target,
      label: 'Goal Achieved!',
    },
    overdue: {
      color: 'bg-red-500',
      badgeVariant: 'destructive' as const,
      badgeClass: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      icon: AlertTriangle,
      label: 'Overdue',
    },
    'nearly-complete': {
      color: 'bg-emerald-500',
      badgeVariant: 'default' as const,
      badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300',
      icon: TrendingUp,
      label: 'Almost There!',
    },
    'on-track': {
      color: 'bg-blue-500',
      badgeVariant: 'default' as const,
      badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      icon: TrendingUp,
      label: 'On Track',
    },
    behind: {
      color: 'bg-yellow-500',
      badgeVariant: 'secondary' as const,
      badgeClass: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      icon: TrendingDown,
      label: 'Needs Attention',
    },
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Main Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium">Progress</h4>
            <Badge className={config.badgeClass}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {config.label}
            </Badge>
          </div>
          <span className="text-sm font-medium">
            {progressPercentage.toFixed(1)}%
          </span>
        </div>
        
        <Progress 
          value={progressPercentage} 
          className={cn("h-3", "[&>div]:transition-colors")}
        />
        
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>₹{goal.currentAmount.toLocaleString()}</span>
          <span>₹{goal.targetAmount.toLocaleString()}</span>
        </div>
      </div>

      {/* Detailed Progress Breakdown */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="space-y-1">
          <span className="text-muted-foreground">Amount Saved</span>
          <p className="font-medium text-green-600 dark:text-green-400">
            ₹{goal.currentAmount.toLocaleString()}
          </p>
        </div>
        
        <div className="space-y-1">
          <span className="text-muted-foreground">Remaining</span>
          <p className="font-medium text-orange-600 dark:text-orange-400">
            ₹{Math.max(0, goal.targetAmount - goal.currentAmount).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Time Progress */}
      <div className="pt-2 border-t space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Time Progress</span>
          <span className={cn('font-medium', {
            'text-red-600 dark:text-red-400': isOverdue,
            'text-green-600 dark:text-green-400': !isOverdue && daysRemaining > 30,
            'text-yellow-600 dark:text-yellow-400': !isOverdue && daysRemaining <= 30,
          })}>
            {isOverdue 
              ? `${Math.abs(daysRemaining)} days overdue`
              : `${daysRemaining} days left`
            }
          </span>
        </div>
        
        {/* Milestone indicators */}
        <div className="flex justify-between items-center">
          {[25, 50, 75, 100].map((milestone) => {
            const isReached = progressPercentage >= milestone;
            return (
              <div key={milestone} className="flex flex-col items-center">
                <div className={cn(
                  'w-3 h-3 rounded-full border-2 transition-colors',
                  isReached 
                    ? 'bg-green-500 border-green-500' 
                    : 'bg-background border-muted-foreground'
                )}>
                  {isReached && (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-white rounded-full" />
                    </div>
                  )}
                </div>
                <span className={cn(
                  'text-xs mt-1',
                  isReached ? 'text-green-600 dark:text-green-400 font-medium' : 'text-muted-foreground'
                )}>
                  {milestone}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
