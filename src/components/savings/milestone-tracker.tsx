'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle2, 
  Circle, 
  Trophy, 
  Target, 
  Calendar,
  TrendingUp,
  Bell,
  Star
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { GoalWithProgress } from '@/lib/types/savings';

interface MilestoneTrackerProps {
  goal: GoalWithProgress;
  onMilestoneAchieved?: (milestoneId: string) => void;
  className?: string;
}

interface MilestoneData {
  id: string;
  percentage: number;
  targetAmount: number;
  achievedAmount: number;
  achievedAt?: Date;
  isAchieved: boolean;
  notified: boolean;
  title: string;
  description: string;
  reward?: string;
}

export function MilestoneTracker({ 
  goal, 
  onMilestoneAchieved,
  className 
}: MilestoneTrackerProps) {
  const [milestones, setMilestones] = useState<MilestoneData[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [recentlyAchieved, setRecentlyAchieved] = useState<MilestoneData | null>(null);

  // Initialize milestone data
  useEffect(() => {
    const standardMilestones: MilestoneData[] = [
      {
        id: '25',
        percentage: 25,
        targetAmount: goal.targetAmount * 0.25,
        achievedAmount: Math.min(goal.currentAmount, goal.targetAmount * 0.25),
        isAchieved: goal.currentAmount >= goal.targetAmount * 0.25,
        notified: false,
        title: 'First Quarter',
        description: 'Great start! You\'ve saved 25% of your goal.',
        reward: '🌟 Achievement Badge'
      },
      {
        id: '50',
        percentage: 50,
        targetAmount: goal.targetAmount * 0.5,
        achievedAmount: Math.min(goal.currentAmount, goal.targetAmount * 0.5),
        isAchieved: goal.currentAmount >= goal.targetAmount * 0.5,
        notified: false,
        title: 'Halfway Hero',
        description: 'Amazing progress! You\'re halfway to your goal.',
        reward: '🏆 Halfway Champion'
      },
      {
        id: '75',
        percentage: 75,
        targetAmount: goal.targetAmount * 0.75,
        achievedAmount: Math.min(goal.currentAmount, goal.targetAmount * 0.75),
        isAchieved: goal.currentAmount >= goal.targetAmount * 0.75,
        notified: false,
        title: 'Almost There',
        description: 'You\'re in the final stretch! 75% complete.',
        reward: '⭐ Nearly There Badge'
      },
      {
        id: '100',
        percentage: 100,
        targetAmount: goal.targetAmount,
        achievedAmount: Math.min(goal.currentAmount, goal.targetAmount),
        isAchieved: goal.currentAmount >= goal.targetAmount,
        notified: false,
        title: 'Goal Achieved!',
        description: 'Congratulations! You\'ve reached your savings goal.',
        reward: '🎉 Goal Master Trophy'
      }
    ];

    setMilestones(standardMilestones);
  }, [goal]);

  // Check for newly achieved milestones
  useEffect(() => {
    const newlyAchieved = milestones.find(
      milestone => milestone.isAchieved && !milestone.notified
    );

    if (newlyAchieved) {
      setRecentlyAchieved(newlyAchieved);
      setShowCelebration(true);
      
      // Mark as notified
      setMilestones(prev => 
        prev.map(m => 
          m.id === newlyAchieved.id 
            ? { ...m, notified: true }
            : m
        )
      );

      // Trigger celebration
      toast.success(
        `🎉 Milestone Achieved: ${newlyAchieved.title}!`,
        {
          description: newlyAchieved.description,
          duration: 5000,
        }
      );

      // Call callback if provided
      onMilestoneAchieved?.(newlyAchieved.id);

      // Auto-hide celebration after 3 seconds
      setTimeout(() => {
        setShowCelebration(false);
      }, 3000);
    }
  }, [milestones, onMilestoneAchieved]);

  const progressPercentage = (goal.currentAmount / goal.targetAmount) * 100;
  const nextMilestone = milestones.find(m => !m.isAchieved);
  const achievedMilestones = milestones.filter(m => m.isAchieved);

  const getMilestoneIcon = (milestone: MilestoneData) => {
    if (milestone.isAchieved) {
      return <CheckCircle2 className="w-5 h-5 text-green-600" />;
    }
    return <Circle className="w-5 h-5 text-gray-400" />;
  };

  const getMilestoneStatus = (milestone: MilestoneData) => {
    if (milestone.isAchieved) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          <Trophy className="w-3 h-3 mr-1" />
          Achieved
        </Badge>
      );
    }
    
    if (milestone.percentage === 100) {
      return (
        <Badge variant="outline" className="border-purple-200 text-purple-800">
          <Target className="w-3 h-3 mr-1" />
          Final Goal
        </Badge>
      );
    }

    const progress = (goal.currentAmount / milestone.targetAmount) * 100;
    if (progress >= 80) {
      return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
          <TrendingUp className="w-3 h-3 mr-1" />
          Almost There
        </Badge>
      );
    }

    return (
      <Badge variant="outline">
        <Calendar className="w-3 h-3 mr-1" />
        Upcoming
      </Badge>
    );
  };

  const handleDismissCelebration = () => {
    setShowCelebration(false);
    setRecentlyAchieved(null);
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Celebration Modal */}
      {showCelebration && recentlyAchieved && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-900 dark:to-blue-900 opacity-50" />
          <CardHeader className="relative z-10 text-center">
            <div className="flex justify-center mb-2">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
                <Trophy className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <CardTitle className="text-xl text-green-800 dark:text-green-200">
              🎉 {recentlyAchieved.title}
            </CardTitle>
            <p className="text-green-700 dark:text-green-300">
              {recentlyAchieved.description}
            </p>
            {recentlyAchieved.reward && (
              <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                {recentlyAchieved.reward}
              </Badge>
            )}
          </CardHeader>
          <CardContent className="relative z-10 text-center">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleDismissCelebration}
              className="border-green-300 hover:bg-green-100"
            >
              Continue
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Milestone Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Milestone Progress
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {achievedMilestones.length} / {milestones.length}
              </Badge>
              {nextMilestone && (
                <Badge variant="outline">
                  Next: {nextMilestone.percentage}%
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Progress Timeline */}
          <div className="space-y-4">
            <div className="relative">
              <Progress value={progressPercentage} className="h-2" />
              
              {/* Milestone markers */}
              <div className="absolute top-0 left-0 w-full h-2 flex justify-between items-center">
                {milestones.map((milestone) => {
                  const position = milestone.percentage;
                  return (
                    <div 
                      key={milestone.id}
                      className="absolute flex flex-col items-center"
                      style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
                    >
                      <div 
                        className={cn(
                          'w-4 h-4 rounded-full border-2 bg-background flex items-center justify-center -mt-1',
                          milestone.isAchieved 
                            ? 'border-green-500 bg-green-500' 
                            : 'border-gray-300'
                        )}
                      >
                        {milestone.isAchieved && (
                          <CheckCircle2 className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <span className="text-xs mt-1 font-medium">
                        {milestone.percentage}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Current Progress Info */}
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>₹{goal.currentAmount.toLocaleString()}</span>
              <span>{progressPercentage.toFixed(1)}% Complete</span>
              <span>₹{goal.targetAmount.toLocaleString()}</span>
            </div>
          </div>

          {/* Next Milestone Info */}
          {nextMilestone && (
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">Next Milestone</h4>
                <Badge variant="outline">
                  {nextMilestone.percentage}%
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                {nextMilestone.description}
              </p>
              <div className="flex justify-between items-center text-sm">
                <span>Progress: ₹{goal.currentAmount.toLocaleString()}</span>
                <span>Target: ₹{nextMilestone.targetAmount.toLocaleString()}</span>
              </div>
              <Progress 
                value={(goal.currentAmount / nextMilestone.targetAmount) * 100} 
                className="h-1 mt-2" 
              />
              <p className="text-xs text-muted-foreground mt-1">
                ₹{(nextMilestone.targetAmount - goal.currentAmount).toLocaleString()} remaining
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Milestone List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5" />
            All Milestones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {milestones.map((milestone) => (
              <div 
                key={milestone.id}
                className={cn(
                  'flex items-center gap-4 p-4 rounded-lg transition-colors',
                  milestone.isAchieved 
                    ? 'bg-green-50 dark:bg-green-950 border border-green-200' 
                    : 'bg-muted/30 hover:bg-muted/50'
                )}
              >
                <div className="flex-shrink-0">
                  {getMilestoneIcon(milestone)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium truncate">{milestone.title}</h4>
                    {getMilestoneStatus(milestone)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {milestone.description}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span>Target: ₹{milestone.targetAmount.toLocaleString()}</span>
                    {milestone.isAchieved && milestone.achievedAt && (
                      <span>Achieved: {milestone.achievedAt.toLocaleDateString()}</span>
                    )}
                  </div>
                </div>

                {milestone.reward && milestone.isAchieved && (
                  <div className="flex-shrink-0">
                    <Badge variant="secondary" className="text-xs">
                      {milestone.reward}
                    </Badge>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Achievement Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Achievement Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {achievedMilestones.length}
              </div>
              <div className="text-sm text-muted-foreground">
                Milestones Achieved
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {milestones.length - achievedMilestones.length}
              </div>
              <div className="text-sm text-muted-foreground">
                Remaining
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {progressPercentage.toFixed(0)}%
              </div>
              <div className="text-sm text-muted-foreground">
                Overall Progress
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {nextMilestone ? nextMilestone.percentage : 100}%
              </div>
              <div className="text-sm text-muted-foreground">
                Next Target
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
