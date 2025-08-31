'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  GripVertical, 
  Target, 
  Calendar, 
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { GoalWithProgress } from '@/lib/types/savings';

// Priority calculation constants
const PRIORITY_SCALE = {
  MAX: 10,  // Highest priority (top position)
  MIN: 1,   // Lowest priority (bottom position)
} as const;

/**
 * Calculates priority value based on position in ordered list
 * @param index Position in the list (0-based)
 * @returns Priority value between PRIORITY_SCALE.MIN and PRIORITY_SCALE.MAX
 */
const calculatePriorityFromPosition = (index: number): number => {
  return Math.max(
    PRIORITY_SCALE.MIN, 
    Math.min(PRIORITY_SCALE.MAX, PRIORITY_SCALE.MAX - index)
  );
};

interface PriorityRankingProps {
  goals: GoalWithProgress[];
  onPriorityUpdate?: (goalId: string, newPriority: number) => void;
  onSave?: (updatedGoals: GoalWithProgress[]) => void;
  className?: string;
}

interface SortableGoalItemProps {
  goal: GoalWithProgress;
  index: number;
  isOverdue: boolean;
  progressPercentage: number;
}

function SortableGoalItem({ goal, index, isOverdue, progressPercentage }: SortableGoalItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: goal.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 8) return 'bg-red-100 text-red-800 border-red-200';
    if (priority >= 5) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  const getPriorityLabel = (priority: number) => {
    if (priority >= 8) return 'High';
    if (priority >= 5) return 'Medium';
    return 'Low';
  };

  const getStatusIcon = () => {
    if (progressPercentage >= 100) {
      return <CheckCircle2 className="w-4 h-4 text-green-600" />;
    }
    if (isOverdue) {
      return <AlertTriangle className="w-4 h-4 text-red-600" />;
    }
    if (goal.isOnTrack) {
      return <TrendingUp className="w-4 h-4 text-blue-600" />;
    }
    return <Info className="w-4 h-4 text-gray-600" />;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'bg-white border rounded-lg p-4 shadow-sm transition-all duration-200',
        isDragging && 'shadow-lg rotate-1 scale-105 z-50',
        'hover:shadow-md hover:border-blue-200'
      )}
      {...attributes}
    >
      <div className="flex items-center gap-4">
        {/* Drag Handle */}
        <div
          {...listeners}
          className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="w-5 h-5" />
        </div>

        {/* Rank Number */}
        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full font-semibold text-sm">
          {index + 1}
        </div>

        {/* Goal Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h4 className="font-medium text-gray-900 truncate">{goal.name}</h4>
            <Badge 
              variant="outline" 
              className={cn('text-xs', getPriorityColor(goal.priority))}
            >
              {getPriorityLabel(goal.priority)} ({goal.priority})
            </Badge>
            {getStatusIcon()}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <Target className="w-3 h-3" />
              <span>₹{goal.targetAmount.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{format(new Date(goal.targetDate), 'MMM dd')}</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>{progressPercentage.toFixed(0)}% complete</span>
            </div>
            <div className={cn(
              'font-medium',
              isOverdue ? 'text-red-600' : goal.isOnTrack ? 'text-green-600' : 'text-yellow-600'
            )}>
              {isOverdue ? 'Overdue' : goal.isOnTrack ? 'On Track' : 'Behind'}
            </div>
          </div>

          {goal.description && (
            <p className="text-xs text-gray-500 mt-1 truncate">{goal.description}</p>
          )}
        </div>

        {/* Progress Indicator */}
        <div className="flex flex-col items-end gap-1">
          <div className="text-sm font-medium text-gray-900">
            ₹{goal.currentAmount.toLocaleString()}
          </div>
          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full transition-all duration-300',
                progressPercentage >= 100 ? 'bg-green-500' :
                progressPercentage >= 75 ? 'bg-blue-500' :
                progressPercentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
              )}
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            />
          </div>
          <div className="text-xs text-gray-500">
            {Math.min(progressPercentage, 100).toFixed(0)}%
          </div>
        </div>
      </div>
    </div>
  );
}

export function PriorityRanking({
  goals,
  onPriorityUpdate,
  onSave,
  className
}: PriorityRankingProps) {
  const [items, setItems] = useState(goals);
  const [hasChanges, setHasChanges] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newItems = arrayMove(items, oldIndex, newIndex);
        
        // Update priorities based on new order using explicit priority calculation
        const updatedItems = newItems.map((item: GoalWithProgress, index: number) => ({
          ...item,
          priority: calculatePriorityFromPosition(index),
        }));

        setItems(updatedItems);
        setHasChanges(true);

        // Call individual priority update callbacks
        if (onPriorityUpdate) {
          updatedItems.forEach((item: GoalWithProgress) => {
            onPriorityUpdate(item.id, item.priority);
          });
        }
      }
    }
  };

  const handleSave = () => {
    if (onSave) {
      onSave(items);
    }
    setHasChanges(false);
  };

  const handleReset = () => {
    setItems(goals);
    setHasChanges(false);
  };

  const getImpactAnalysis = () => {
    const totalTargetAmount = items.reduce((sum, goal) => sum + goal.targetAmount, 0);
    const totalCurrentAmount = items.reduce((sum, goal) => sum + goal.currentAmount, 0);
    const averageProgress = (totalCurrentAmount / totalTargetAmount) * 100;

    const highPriorityGoals = items.filter(goal => goal.priority >= 8);
    const mediumPriorityGoals = items.filter(goal => goal.priority >= 5 && goal.priority < 8);
    const lowPriorityGoals = items.filter(goal => goal.priority < 5);

    const overdueGoals = items.filter(goal => {
      const daysRemaining = goal.daysRemaining;
      const progressPercentage = (goal.currentAmount / goal.targetAmount) * 100;
      return daysRemaining < 0 && progressPercentage < 100;
    });

    return {
      totalGoals: items.length,
      totalTargetAmount,
      totalCurrentAmount,
      averageProgress,
      highPriorityGoals: highPriorityGoals.length,
      mediumPriorityGoals: mediumPriorityGoals.length,
      lowPriorityGoals: lowPriorityGoals.length,
      overdueGoals: overdueGoals.length,
      onTrackGoals: items.filter(goal => goal.isOnTrack).length,
    };
  };

  const analysis = getImpactAnalysis();

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header and Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <GripVertical className="w-5 h-5" />
              Goal Priority Ranking
            </CardTitle>
            <div className="flex items-center gap-2">
              {hasChanges && (
                <>
                  <Button variant="outline" size="sm" onClick={handleReset}>
                    Reset
                  </Button>
                  <Button size="sm" onClick={handleSave}>
                    Save Changes
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Drag and drop goals to reorder their priority. The top position receives priority {PRIORITY_SCALE.MAX}, 
              with each subsequent position decreasing by 1 down to a minimum of {PRIORITY_SCALE.MIN}. 
              Higher priority goals will be suggested for increased allocation.
            </p>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="text-center">
                <div className="text-lg font-semibold text-red-600">
                  {analysis.highPriorityGoals}
                </div>
                <div className="text-xs text-muted-foreground">High Priority</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-yellow-600">
                  {analysis.mediumPriorityGoals}
                </div>
                <div className="text-xs text-muted-foreground">Medium Priority</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-green-600">
                  {analysis.lowPriorityGoals}
                </div>
                <div className="text-xs text-muted-foreground">Low Priority</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-600">
                  {analysis.onTrackGoals}
                </div>
                <div className="text-xs text-muted-foreground">On Track</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-purple-600">
                  {analysis.averageProgress.toFixed(0)}%
                </div>
                <div className="text-xs text-muted-foreground">Avg Progress</div>
              </div>
            </div>

            {analysis.overdueGoals > 0 && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <div className="text-sm">
                  <span className="font-medium text-red-800">
                    {analysis.overdueGoals} goal{analysis.overdueGoals > 1 ? 's are' : ' is'} overdue.
                  </span>
                  <span className="text-red-700 ml-1">
                    Consider adjusting priorities or extending deadlines.
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sortable Goal List */}
      <Card>
        <CardHeader>
          <CardTitle>Goal Ranking ({items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={items.map(goal => goal.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {items.map((goal, index) => {
                  const progressPercentage = (goal.currentAmount / goal.targetAmount) * 100;
                  const isOverdue = goal.daysRemaining < 0 && progressPercentage < 100;

                  return (
                    <SortableGoalItem
                      key={goal.id}
                      goal={goal}
                      index={index}
                      isOverdue={isOverdue}
                      progressPercentage={progressPercentage}
                    />
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
        </CardContent>
      </Card>

      {/* Priority Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>Priority Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <Badge className="bg-red-100 text-red-800 border-red-200">High (8-10)</Badge>
              <div>
                <div className="font-medium">Emergency funds, critical financial goals</div>
                <div className="text-muted-foreground">Goals that need immediate attention or have approaching deadlines</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Medium (5-7)</Badge>
              <div>
                <div className="font-medium">Important but flexible goals</div>
                <div className="text-muted-foreground">Goals with moderate timelines that can be adjusted if needed</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge className="bg-green-100 text-green-800 border-green-200">Low (1-4)</Badge>
              <div>
                <div className="font-medium">Long-term or aspirational goals</div>
                <div className="text-muted-foreground">Goals that can be delayed if higher priorities need more resources</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
