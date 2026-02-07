'use client';

import { useState } from 'react';
import { CalendarIcon, Target, TrendingUp, MoreVertical, Trash2, Edit3, PauseCircle, PlayCircle } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { toast } from 'sonner';
import { deleteSavingsGoal, updateSavingsGoal } from '@/lib/actions/savings-goals';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { GoalProgressBars } from './goal-progress-bars';
import { PercentageCompletionIndicators } from './percentage-completion-indicators';
import { GoalCelebration } from './goal-celebration';
import type { GoalWithProgress } from '@/lib/types/savings';

interface GoalProgressCardProps {
  goal: GoalWithProgress;
  onUpdate: () => void;
}

export function GoalProgressCard({ goal, onUpdate }: GoalProgressCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationMilestone, setCelebrationMilestone] = useState<{
    id: string;
    percentage: number;
    title: string;
    description: string;
    reward?: string;
  } | null>(null);

  // Calculate progress percentage
  const progressPercentage = (goal.currentAmount / goal.targetAmount) * 100;

  // Check for milestone celebration
  const shouldShowMilestoneCelebration = () => {
    const currentProgress = progressPercentage;

    // Check if we've just reached a milestone
    if (currentProgress >= 100 && goal.status !== 'completed') {
      return { isGoalComplete: true, milestone: null };
    }

    return { isGoalComplete: false, milestone: null };
  };

  const { isGoalComplete } = shouldShowMilestoneCelebration();
  const isCompleted = progressPercentage >= 100;

  // Calculate days remaining
  const daysRemaining = differenceInDays(new Date(goal.targetDate), new Date());
  const isOverdue = daysRemaining < 0 && !isCompleted;

  // Get status color
  const getStatusColor = () => {
    switch (goal.status) {
      case 'active':
        return isCompleted ? 'bg-green-500' : 'bg-blue-500';
      case 'paused':
        return 'bg-yellow-500';
      case 'completed':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Get status text
  const getStatusText = () => {
    if (isCompleted && goal.status !== 'completed') {
      return 'Ready to Complete';
    }
    return goal.status.charAt(0).toUpperCase() + goal.status.slice(1);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteSavingsGoal(goal.id);

      toast.success('Goal deleted successfully');
      onUpdate();
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast.error('Failed to delete goal');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleStatusToggle = async () => {
    const newStatus = goal.status === 'active' ? 'paused' : 'active';
    setIsUpdatingStatus(true);

    try {
      await updateSavingsGoal(goal.id, {
        status: newStatus,
      });

      toast.success(`Goal ${newStatus === 'active' ? 'resumed' : 'paused'}`);
      onUpdate();
    } catch (error) {
      console.error('Error updating goal status:', error);
      toast.error('Failed to update goal status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleMarkComplete = async () => {
    setIsUpdatingStatus(true);

    try {
      await updateSavingsGoal(goal.id, {
        status: 'completed',
        currentAmount: goal.targetAmount, // Ensure it's exactly at target
      });

      toast.success('Congratulations! Goal completed! 🎉');
      onUpdate();
    } catch (error) {
      console.error('Error completing goal:', error);
      toast.error('Failed to complete goal');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg">{goal.name}</CardTitle>
              {goal.description && (
                <p className="text-sm text-muted-foreground">{goal.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className={`${getStatusColor()} text-white`}
              >
                {getStatusText()}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => console.log('Edit goal')}>
                    <Edit3 className="mr-2 h-4 w-4" />
                    Edit Goal
                  </DropdownMenuItem>

                  {isCompleted && goal.status !== 'completed' && (
                    <DropdownMenuItem
                      onClick={handleMarkComplete}
                      disabled={isUpdatingStatus}
                    >
                      <Target className="mr-2 h-4 w-4" />
                      Mark Complete
                    </DropdownMenuItem>
                  )}

                  {goal.status !== 'completed' && (
                    <DropdownMenuItem
                      onClick={handleStatusToggle}
                      disabled={isUpdatingStatus}
                    >
                      {goal.status === 'active' ? (
                        <>
                          <PauseCircle className="mr-2 h-4 w-4" />
                          Pause Goal
                        </>
                      ) : (
                        <>
                          <PlayCircle className="mr-2 h-4 w-4" />
                          Resume Goal
                        </>
                      )}
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Goal
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Progress Visualization */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Main Progress Section */}
            <div className="lg:col-span-2">
              <GoalProgressBars
                goal={goal}
              />
            </div>

            {/* Circular Progress Indicator */}
            <div className="flex justify-center lg:justify-end">
              <PercentageCompletionIndicators
                goal={goal}
                variant="circular"
                size="md"
              />
            </div>
          </div>

          {/* Goal Details Grid - Responsive */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm pt-4 border-t">
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-muted-foreground">
                <CalendarIcon className="h-3 w-3" />
                <span>Target Date</span>
              </div>
              <p className={`font-medium ${isOverdue ? 'text-destructive' : ''}`}>
                {format(new Date(goal.targetDate), 'MMM dd, yyyy')}
              </p>
              {daysRemaining >= 0 ? (
                <p className="text-xs text-muted-foreground">
                  {daysRemaining} days remaining
                </p>
              ) : (
                <p className="text-xs text-destructive">
                  {Math.abs(daysRemaining)} days overdue
                </p>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1 text-muted-foreground">
                <TrendingUp className="h-3 w-3" />
                <span>Priority</span>
              </div>
              <p className="font-medium">{goal.priority}/10</p>
              <p className="text-xs text-muted-foreground">
                {goal.priority >= 8 ? 'High' : goal.priority >= 5 ? 'Medium' : 'Low'} priority
              </p>
            </div>
          </div>

          {/* Account and Category Info */}
          {(goal.accountName || goal.categoryName) && (
            <div className="space-y-2 pt-2 border-t">
              {goal.accountName && (
                <p className="text-xs text-muted-foreground">
                  Linked to <span className="font-medium">{goal.accountName}</span>
                </p>
              )}

              {goal.categoryName && (
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: goal.categoryColor || '#6b7280' }}
                  />
                  <span className="text-xs text-muted-foreground">{goal.categoryName}</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Savings Goal</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{goal.name}&rdquo;? This action cannot be undone and will remove all progress history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete Goal'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Milestone Celebration */}
      {showCelebration && (
        <GoalCelebration
          goal={goal}
          milestone={celebrationMilestone || undefined}
          isGoalComplete={isGoalComplete}
          onClose={() => {
            setShowCelebration(false);
            setCelebrationMilestone(null);
          }}
          onShare={() => {
            toast.success('Achievement shared successfully!');
          }}
        />
      )}
    </>
  );
}
