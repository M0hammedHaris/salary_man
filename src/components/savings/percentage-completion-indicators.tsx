'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, Clock, TrendingUp, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GoalWithProgress } from '@/lib/types/savings';

interface PercentageCompletionIndicatorsProps {
  goal: GoalWithProgress;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'circular' | 'card' | 'inline';
  className?: string;
}

// Custom circular progress component using SVG
function CircularProgress({ 
  percentage, 
  size = 100, 
  strokeWidth = 8,
  color = '#3b82f6' 
}: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-300 ease-in-out"
        />
      </svg>
      {/* Percentage text in center */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-medium" style={{ color }}>
          {percentage.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

export function PercentageCompletionIndicators({ 
  goal, 
  size = 'md', 
  variant = 'circular',
  className 
}: PercentageCompletionIndicatorsProps) {
  const progressPercentage = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
  const isCompleted = progressPercentage >= 100;
  
  // Calculate time progress
  const startDate = new Date(goal.createdAt);
  const targetDate = new Date(goal.targetDate);
  const today = new Date();
  
  const totalDays = Math.ceil((targetDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const elapsedDays = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const timeProgressPercentage = Math.min((elapsedDays / totalDays) * 100, 100);
  
  // Determine progress status
  const getProgressStatus = () => {
    const timeDiff = timeProgressPercentage - progressPercentage;
    if (isCompleted) return { status: 'completed', color: '#10b981' };
    if (timeDiff > 20) return { status: 'behind', color: '#ef4444' };
    if (timeDiff > 10) return { status: 'caution', color: '#f59e0b' };
    return { status: 'ontrack', color: '#3b82f6' };
  };

  const { status, color } = getProgressStatus();

  // Size configurations
  const sizeConfig = {
    sm: { width: 60, height: 60, strokeWidth: 8 },
    md: { width: 100, height: 100, strokeWidth: 6 },
    lg: { width: 150, height: 150, strokeWidth: 4 },
  };

  const config = sizeConfig[size];

  if (variant === 'circular') {
    return (
      <div className={cn('flex flex-col items-center space-y-2', className)}>
        <CircularProgress
          percentage={progressPercentage}
          size={config.width}
          strokeWidth={config.strokeWidth}
          color={color}
        />
        <Badge variant={status === 'completed' ? 'default' : 'secondary'}>
          {status === 'completed' && 'Goal Achieved!'}
          {status === 'ontrack' && 'On Track'}
          {status === 'caution' && 'Needs Attention'}
          {status === 'behind' && 'Behind Schedule'}
        </Badge>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <Card className={cn('', className)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-sm">Goal Progress</h4>
            <Badge variant={isCompleted ? 'default' : 'secondary'}>
              {progressPercentage.toFixed(1)}%
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Financial Progress */}
            <div className="text-center">
              <div className="mx-auto mb-2 flex justify-center">
                <CircularProgress
                  percentage={progressPercentage}
                  size={80}
                  strokeWidth={8}
                  color={color}
                />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                  <DollarSign className="w-3 h-3" />
                  <span>Amount</span>
                </div>
                <p className="text-sm font-medium">
                  ₹{goal.currentAmount.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Time Progress */}
            <div className="text-center">
              <div className="mx-auto mb-2 flex justify-center">
                <CircularProgress
                  percentage={timeProgressPercentage}
                  size={80}
                  strokeWidth={8}
                  color="#6b7280"
                />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>Time</span>
                </div>
                <p className="text-sm font-medium">
                  {elapsedDays} / {totalDays} days
                </p>
              </div>
            </div>
          </div>

          {/* Status Summary */}
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              {status === 'completed' && <Target className="w-4 h-4 text-green-600" />}
              {status === 'ontrack' && <TrendingUp className="w-4 h-4 text-blue-600" />}
              {(status === 'caution' || status === 'behind') && <TrendingUp className="w-4 h-4 text-yellow-600" />}
              
              <span className="text-sm font-medium">
                {status === 'completed' && 'Goal Completed!'}
                {status === 'ontrack' && 'Progressing Well'}
                {status === 'caution' && 'Monitor Progress'}
                {status === 'behind' && 'Action Needed'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Inline variant
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <CircularProgress
        percentage={progressPercentage}
        size={config.width}
        strokeWidth={config.strokeWidth}
        color={color}
      />
      
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{goal.name}</span>
          <Badge variant={isCompleted ? 'default' : 'secondary'} className="text-xs">
            {progressPercentage.toFixed(1)}%
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          ₹{goal.currentAmount.toLocaleString()} of ₹{goal.targetAmount.toLocaleString()}
        </p>
        <div className="flex items-center gap-2 text-xs">
          <span className={cn('px-2 py-1 rounded-full text-xs font-medium', {
            'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300': status === 'completed',
            'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300': status === 'ontrack',
            'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300': status === 'caution',
            'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300': status === 'behind',
          })}>
            {status === 'completed' && 'Achieved'}
            {status === 'ontrack' && 'On Track'}
            {status === 'caution' && 'Monitor'}
            {status === 'behind' && 'Behind'}
          </span>
        </div>
      </div>
    </div>
  );
}
