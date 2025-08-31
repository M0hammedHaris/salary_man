'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2,
  PieChart,
  BarChart3,
  Lightbulb,
  ArrowRight,
  Calculator,
  Shuffle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GoalWithProgress } from '@/lib/types/savings';

interface ResourceAllocation {
  totalMonthlyIncome: number;
  totalMonthlyExpenses: number;
  availableForSavings: number;
  currentGoalAllocations: GoalAllocation[];
  recommendations: AllocationRecommendation[];
  conflicts: AllocationConflict[];
}

interface GoalAllocation {
  goalId: string;
  goalName: string;
  currentAllocation: number;
  recommendedAllocation: number;
  priority: number;
  timelineImpact: 'ahead' | 'on-track' | 'behind';
}

interface AllocationRecommendation {
  type: 'increase' | 'decrease' | 'redistribute';
  goalId: string;
  goalName: string;
  currentAmount: number;
  recommendedAmount: number;
  reason: string;
  impact: string;
  potentialSavings?: number;
}

interface AllocationConflict {
  type: 'insufficient_funds' | 'unrealistic_timeline' | 'competing_priorities';
  affectedGoals: string[];
  description: string;
  severity: 'low' | 'medium' | 'high';
  suggestions: string[];
}

interface ResourceAllocationHelperProps {
  goals: GoalWithProgress[];
  monthlyIncome: number;
  monthlyExpenses: number;
  onAllocationUpdate?: (goalId: string, newAllocation: number) => void;
  className?: string;
}

export function ResourceAllocationHelper({
  goals,
  monthlyIncome,
  monthlyExpenses,
  onAllocationUpdate,
  className
}: ResourceAllocationHelperProps) {
  const [allocation, setAllocation] = useState<ResourceAllocation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [optimizedAllocations, setOptimizedAllocations] = useState<GoalAllocation[]>([]);
  const [hasOptimizationChanges, setHasOptimizationChanges] = useState(false);

  // Efficiently compare allocation arrays for changes
  const compareAllocations = (current: GoalAllocation[], optimized: GoalAllocation[]): boolean => {
    if (current.length !== optimized.length) return true;
    
    for (let i = 0; i < current.length; i++) {
      if (current[i].goalId !== optimized[i].goalId || 
          current[i].currentAllocation !== optimized[i].currentAllocation) {
        return true;
      }
    }
    return false;
  };

  // Calculate resource allocation
  useEffect(() => {
    const calculateAllocation = () => {
      const availableForSavings = Math.max(0, monthlyIncome - monthlyExpenses);
      const activeGoals = goals.filter(goal => goal.status === 'active');
      
      // Calculate current allocations based on goal requirements
      const currentAllocations: GoalAllocation[] = activeGoals.map(goal => {
        const remainingAmount = goal.targetAmount - goal.currentAmount;
        const daysRemaining = Math.max(1, goal.daysRemaining);
        const monthsRemaining = Math.max(1, daysRemaining / 30);
        const requiredMonthly = remainingAmount / monthsRemaining;
        
        return {
          goalId: goal.id,
          goalName: goal.name,
          currentAllocation: goal.requiredDailySavings * 30, // Convert daily to monthly
          recommendedAllocation: Math.ceil(requiredMonthly),
          priority: goal.priority,
          timelineImpact: goal.isOnTrack ? 'on-track' : 'behind'
        };
      });

      // Calculate total allocations
      const totalRecommendedAllocation = currentAllocations.reduce(
        (sum, alloc) => sum + alloc.recommendedAllocation, 0
      );

      // Generate recommendations
      const recommendations: AllocationRecommendation[] = [];
      const conflicts: AllocationConflict[] = [];

      // Check for insufficient funds
      if (totalRecommendedAllocation > availableForSavings) {
        conflicts.push({
          type: 'insufficient_funds',
          affectedGoals: currentAllocations.map(a => a.goalId),
          description: `Your goals require ₹${totalRecommendedAllocation.toLocaleString()} monthly, but you only have ₹${availableForSavings.toLocaleString()} available.`,
          severity: 'high',
          suggestions: [
            'Consider extending goal deadlines',
            'Prioritize fewer goals',
            'Look for ways to increase income or reduce expenses'
          ]
        });
      }

      // Generate optimization recommendations
      currentAllocations.forEach(alloc => {
        if (alloc.timelineImpact === 'behind' && alloc.currentAllocation < alloc.recommendedAllocation) {
          recommendations.push({
            type: 'increase',
            goalId: alloc.goalId,
            goalName: alloc.goalName,
            currentAmount: alloc.currentAllocation,
            recommendedAmount: alloc.recommendedAllocation,
            reason: 'Goal is falling behind schedule',
            impact: `Increasing allocation by ₹${(alloc.recommendedAllocation - alloc.currentAllocation).toLocaleString()} will help get back on track`
          });
        }
      });

      // Check for competing high-priority goals
      const highPriorityGoals = currentAllocations.filter(a => a.priority >= 8);
      if (highPriorityGoals.length > 1) {
        conflicts.push({
          type: 'competing_priorities',
          affectedGoals: highPriorityGoals.map(a => a.goalId),
          description: 'Multiple high-priority goals are competing for resources',
          severity: 'medium',
          suggestions: [
            'Consider adjusting goal priorities',
            'Focus on completing one high-priority goal first',
            'Extend timelines for lower-priority goals'
          ]
        });
      }

      return {
        totalMonthlyIncome: monthlyIncome,
        totalMonthlyExpenses: monthlyExpenses,
        availableForSavings,
        currentGoalAllocations: currentAllocations,
        recommendations,
        conflicts
      };
    };

    setIsLoading(true);
    const result = calculateAllocation();
    setAllocation(result);
    setOptimizedAllocations(result.currentGoalAllocations);
    setHasOptimizationChanges(false); // Reset changes when recalculating
    setIsLoading(false);
  }, [goals, monthlyIncome, monthlyExpenses]);

  const handleOptimizeAllocations = () => {
    if (!allocation) return;

    const availableAmount = allocation.availableForSavings;
    const sortedGoals = [...allocation.currentGoalAllocations].sort((a, b) => {
      // Sort by priority first, then by timeline impact
      if (a.priority !== b.priority) return b.priority - a.priority;
      if (a.timelineImpact === 'behind' && b.timelineImpact !== 'behind') return -1;
      if (b.timelineImpact === 'behind' && a.timelineImpact !== 'behind') return 1;
      return 0;
    });

    let remainingAmount = availableAmount;
    const optimized: GoalAllocation[] = [];

    // Allocate based on priority and urgency
    sortedGoals.forEach(goal => {
      const minRequired = Math.min(goal.recommendedAllocation, remainingAmount);
      const allocation = Math.max(0, minRequired);
      
      optimized.push({
        ...goal,
        currentAllocation: allocation,
        timelineImpact: allocation >= goal.recommendedAllocation ? 'on-track' : 'behind'
      });
      
      remainingAmount -= allocation;
    });

    setOptimizedAllocations(optimized);
    setHasOptimizationChanges(compareAllocations(allocation.currentGoalAllocations, optimized));
  };

  const handleApplyOptimization = () => {
    optimizedAllocations.forEach(alloc => {
      if (onAllocationUpdate) {
        onAllocationUpdate(alloc.goalId, alloc.currentAllocation);
      }
    });
    setHasOptimizationChanges(false);
  };

  const getSeverityColor = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getTimelineIcon = (impact: 'ahead' | 'on-track' | 'behind') => {
    switch (impact) {
      case 'ahead': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'on-track': return <CheckCircle2 className="w-4 h-4 text-blue-600" />;
      case 'behind': return <TrendingDown className="w-4 h-4 text-red-600" />;
    }
  };

  if (isLoading || !allocation) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  const utilizationPercentage = (allocation.currentGoalAllocations.reduce(
    (sum, alloc) => sum + alloc.currentAllocation, 0
  ) / allocation.availableForSavings) * 100;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Overview Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Resource Allocation Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                ₹{allocation.totalMonthlyIncome.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Monthly Income</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                ₹{allocation.totalMonthlyExpenses.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Monthly Expenses</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                ₹{allocation.availableForSavings.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Available for Savings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {utilizationPercentage.toFixed(0)}%
              </div>
              <div className="text-sm text-muted-foreground">Allocation Utilization</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Savings Utilization</span>
              <span>{utilizationPercentage.toFixed(1)}%</span>
            </div>
            <Progress value={Math.min(utilizationPercentage, 100)} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Conflicts and Warnings */}
      {allocation.conflicts.length > 0 && (
        <div className="space-y-3">
          {allocation.conflicts.map((conflict, index) => (
            <Alert key={index} className={cn('border', getSeverityColor(conflict.severity))}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <div className="font-medium">{conflict.description}</div>
                  <div className="text-sm">
                    <strong>Suggestions:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      {conflict.suggestions.map((suggestion, idx) => (
                        <li key={idx}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Allocation Management */}
      <Tabs defaultValue="current" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="current">Current Allocation</TabsTrigger>
          <TabsTrigger value="optimized">Optimized Plan</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Current Goal Allocations
                </CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleOptimizeAllocations}
                >
                  <Shuffle className="w-4 h-4 mr-2" />
                  Optimize
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {allocation.currentGoalAllocations.map((alloc) => (
                  <div key={alloc.goalId} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div>
                          <h4 className="font-medium">{alloc.goalName}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {getTimelineIcon(alloc.timelineImpact)}
                            <span className="capitalize">{alloc.timelineImpact.replace('-', ' ')}</span>
                            <Badge variant="outline" className="ml-2">
                              Priority {alloc.priority}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold">
                          ₹{alloc.currentAllocation.toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Recommended: ₹{alloc.recommendedAllocation.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Allocation vs Recommended</span>
                        <span>
                          {((alloc.currentAllocation / alloc.recommendedAllocation) * 100).toFixed(0)}%
                        </span>
                      </div>
                      <Progress 
                        value={Math.min((alloc.currentAllocation / alloc.recommendedAllocation) * 100, 100)} 
                        className="h-2" 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimized" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Optimized Allocation Plan
                </CardTitle>
                <Button 
                  size="sm"
                  onClick={handleApplyOptimization}
                  disabled={!hasOptimizationChanges}
                >
                  Apply Changes
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {optimizedAllocations.map((alloc) => {
                  const original = allocation.currentGoalAllocations.find(a => a.goalId === alloc.goalId);
                  const isChanged = original && Math.abs(original.currentAllocation - alloc.currentAllocation) > 0.01; // Use small epsilon for floating point comparison
                  
                  return (
                    <div key={alloc.goalId} className={cn(
                      'border rounded-lg p-4',
                      isChanged && 'border-blue-200 bg-blue-50/50'
                    )}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div>
                            <h4 className="font-medium">{alloc.goalName}</h4>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              {getTimelineIcon(alloc.timelineImpact)}
                              <span className="capitalize">{alloc.timelineImpact.replace('-', ' ')}</span>
                              <Badge variant="outline" className="ml-2">
                                Priority {alloc.priority}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold">
                            ₹{alloc.currentAllocation.toLocaleString()}
                          </div>
                          {isChanged && original && (
                            <div className="text-sm text-blue-600">
                              {alloc.currentAllocation > original.currentAllocation ? '+' : ''}
                              ₹{(alloc.currentAllocation - original.currentAllocation).toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Allocation vs Recommended</span>
                          <span>
                            {((alloc.currentAllocation / alloc.recommendedAllocation) * 100).toFixed(0)}%
                          </span>
                        </div>
                        <Progress 
                          value={Math.min((alloc.currentAllocation / alloc.recommendedAllocation) * 100, 100)} 
                          className="h-2" 
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                Optimization Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {allocation.recommendations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500" />
                  <p>Your current allocation looks good! No recommendations at this time.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {allocation.recommendations.map((rec, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {rec.type === 'increase' && <TrendingUp className="w-5 h-5 text-green-600" />}
                          {rec.type === 'decrease' && <TrendingDown className="w-5 h-5 text-red-600" />}
                          {rec.type === 'redistribute' && <ArrowRight className="w-5 h-5 text-blue-600" />}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium mb-1">{rec.goalName}</h4>
                          <p className="text-sm text-muted-foreground mb-2">{rec.reason}</p>
                          <div className="flex items-center gap-4 text-sm">
                            <span>Current: ₹{rec.currentAmount.toLocaleString()}</span>
                            <ArrowRight className="w-4 h-4" />
                            <span className="font-medium">Recommended: ₹{rec.recommendedAmount.toLocaleString()}</span>
                          </div>
                          <p className="text-sm text-blue-600 mt-2">{rec.impact}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
