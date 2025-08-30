'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Target,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  Zap,
  Settings,
  Eye,
  Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { GoalWithProgress } from '@/lib/types/savings';

interface MultiGoalOverviewProps {
  goals: GoalWithProgress[];
  monthlyIncome: number;
  monthlyExpenses: number;
  onGoalSelect?: (goalId: string) => void;
  onResourceAllocation?: () => void;
  onPriorityReorder?: () => void;
  className?: string;
}

interface GoalMetrics {
  totalGoals: number;
  activeGoals: number;
  completedGoals: number;
  pausedGoals: number;
  totalTargetAmount: number;
  totalCurrentAmount: number;
  totalRemainingAmount: number;
  averageProgress: number;
  onTrackGoals: number;
  behindGoals: number;
  aheadGoals: number;
  overdueGoals: number;
  totalMonthlyRequirement: number;
  availableForSavings: number;
  allocationUtilization: number;
}

export function MultiGoalOverview({
  goals,
  monthlyIncome,
  monthlyExpenses,
  onGoalSelect,
  onResourceAllocation,
  onPriorityReorder,
  className
}: MultiGoalOverviewProps) {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'paused'>('all');
  const [sortBy, setSortBy] = useState<'priority' | 'progress' | 'deadline' | 'amount'>('priority');

  // Calculate comprehensive metrics
  const metrics = useMemo((): GoalMetrics => {
    const activeGoals = goals.filter(g => g.status === 'active');
    const completedGoals = goals.filter(g => g.status === 'completed');
    const pausedGoals = goals.filter(g => g.status === 'paused');

    const totalTargetAmount = goals.reduce((sum, g) => sum + g.targetAmount, 0);
    const totalCurrentAmount = goals.reduce((sum, g) => sum + g.currentAmount, 0);
    const totalRemainingAmount = totalTargetAmount - totalCurrentAmount;

    const averageProgress = totalTargetAmount > 0 ? (totalCurrentAmount / totalTargetAmount) * 100 : 0;

    let onTrackGoals = 0;
    let behindGoals = 0;
    let aheadGoals = 0;
    let overdueGoals = 0;
    let totalMonthlyRequirement = 0;

    activeGoals.forEach(goal => {
      const progressPercentage = (goal.currentAmount / goal.targetAmount) * 100;
      const daysRemaining = goal.daysRemaining;
      
      if (daysRemaining < 0 && progressPercentage < 100) {
        overdueGoals++;
      } else if (goal.isOnTrack) {
        onTrackGoals++;
      } else if (progressPercentage > (100 - (daysRemaining / (daysRemaining + 30)) * 100)) {
        aheadGoals++;
      } else {
        behindGoals++;
      }

      // Calculate monthly requirement
      const remainingAmount = goal.targetAmount - goal.currentAmount;
      const monthsRemaining = Math.max(1, daysRemaining / 30);
      totalMonthlyRequirement += remainingAmount / monthsRemaining;
    });

    const availableForSavings = Math.max(0, monthlyIncome - monthlyExpenses);
    const allocationUtilization = availableForSavings > 0 ? (totalMonthlyRequirement / availableForSavings) * 100 : 0;

    return {
      totalGoals: goals.length,
      activeGoals: activeGoals.length,
      completedGoals: completedGoals.length,
      pausedGoals: pausedGoals.length,
      totalTargetAmount,
      totalCurrentAmount,
      totalRemainingAmount,
      averageProgress,
      onTrackGoals,
      behindGoals,
      aheadGoals,
      overdueGoals,
      totalMonthlyRequirement,
      availableForSavings,
      allocationUtilization
    };
  }, [goals, monthlyIncome, monthlyExpenses]);

  // Filter and sort goals
  const filteredGoals = useMemo(() => {
    let filtered = goals;

    if (filter !== 'all') {
      filtered = goals.filter(goal => goal.status === filter);
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          return b.priority - a.priority;
        case 'progress':
          return (b.currentAmount / b.targetAmount) - (a.currentAmount / a.targetAmount);
        case 'deadline':
          return a.daysRemaining - b.daysRemaining;
        case 'amount':
          return b.targetAmount - a.targetAmount;
        default:
          return 0;
      }
    });
  }, [goals, filter, sortBy]);

  // Prepare chart data
  const priorityDistribution = useMemo(() => [
    { name: 'High Priority (8-10)', value: goals.filter(g => g.priority >= 8).length, color: '#ef4444' },
    { name: 'Medium Priority (5-7)', value: goals.filter(g => g.priority >= 5 && g.priority < 8).length, color: '#f59e0b' },
    { name: 'Low Priority (1-4)', value: goals.filter(g => g.priority < 5).length, color: '#10b981' }
  ], [goals]);

  const progressDistribution = useMemo(() => [
    { name: 'Completed (100%)', value: goals.filter(g => (g.currentAmount / g.targetAmount) * 100 >= 100).length, color: '#10b981' },
    { name: 'Near Completion (75-99%)', value: goals.filter(g => { const p = (g.currentAmount / g.targetAmount) * 100; return p >= 75 && p < 100; }).length, color: '#3b82f6' },
    { name: 'In Progress (25-74%)', value: goals.filter(g => { const p = (g.currentAmount / g.targetAmount) * 100; return p >= 25 && p < 75; }).length, color: '#f59e0b' },
    { name: 'Just Started (0-24%)', value: goals.filter(g => (g.currentAmount / g.targetAmount) * 100 < 25).length, color: '#ef4444' }
  ], [goals]);

  const statusDistribution = useMemo(() => [
    { name: 'On Track', value: metrics.onTrackGoals, color: '#10b981' },
    { name: 'Behind Schedule', value: metrics.behindGoals, color: '#f59e0b' },
    { name: 'Ahead of Schedule', value: metrics.aheadGoals, color: '#3b82f6' },
    { name: 'Overdue', value: metrics.overdueGoals, color: '#ef4444' }
  ], [metrics]);

  const getGoalStatusIcon = (goal: GoalWithProgress) => {
    const progressPercentage = (goal.currentAmount / goal.targetAmount) * 100;
    const isOverdue = goal.daysRemaining < 0 && progressPercentage < 100;

    if (progressPercentage >= 100) return <CheckCircle2 className="w-4 h-4 text-green-600" />;
    if (isOverdue) return <AlertTriangle className="w-4 h-4 text-red-600" />;
    if (goal.isOnTrack) return <TrendingUp className="w-4 h-4 text-blue-600" />;
    return <TrendingDown className="w-4 h-4 text-yellow-600" />;
  };

  const getGoalStatusText = (goal: GoalWithProgress) => {
    const progressPercentage = (goal.currentAmount / goal.targetAmount) * 100;
    const isOverdue = goal.daysRemaining < 0 && progressPercentage < 100;

    if (progressPercentage >= 100) return 'Completed';
    if (isOverdue) return 'Overdue';
    if (goal.isOnTrack) return 'On Track';
    return 'Behind';
  };

  const CustomTooltip = ({ active, payload, label }: { 
    active?: boolean; 
    payload?: Array<{ value: number }>; 
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border rounded shadow">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-sm text-blue-600">
            {payload[0].value} goals
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Goals</p>
                <p className="text-2xl font-bold">{metrics.totalGoals}</p>
              </div>
              <Target className="w-8 h-8 text-blue-600" />
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              {metrics.activeGoals} active, {metrics.completedGoals} completed
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Target</p>
                <p className="text-2xl font-bold">₹{(metrics.totalTargetAmount / 100000).toFixed(1)}L</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              ₹{(metrics.totalCurrentAmount / 100000).toFixed(1)}L saved so far
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Average Progress</p>
                <p className="text-2xl font-bold">{metrics.averageProgress.toFixed(0)}%</p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-600" />
            </div>
            <div className="mt-2">
              <Progress value={metrics.averageProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Monthly Requirement</p>
                <p className="text-2xl font-bold">₹{(metrics.totalMonthlyRequirement / 1000).toFixed(0)}K</p>
              </div>
              <Calendar className="w-8 h-8 text-orange-600" />
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              {metrics.allocationUtilization.toFixed(0)}% of available savings
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts and Warnings */}
      {(metrics.overdueGoals > 0 || metrics.allocationUtilization > 100) && (
        <div className="space-y-3">
          {metrics.overdueGoals > 0 && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription>
                <span className="font-medium text-red-800">
                  {metrics.overdueGoals} goal{metrics.overdueGoals > 1 ? 's are' : ' is'} overdue.
                </span>
                <span className="text-red-700 ml-1">
                  Consider adjusting deadlines or priorities.
                </span>
              </AlertDescription>
            </Alert>
          )}
          
          {metrics.allocationUtilization > 100 && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <Zap className="h-4 w-4 text-yellow-600" />
              <AlertDescription>
                <span className="font-medium text-yellow-800">
                  Resource allocation is over capacity ({metrics.allocationUtilization.toFixed(0)}%).
                </span>
                <span className="text-yellow-700 ml-1">
                  Your goals require ₹{(metrics.totalMonthlyRequirement / 1000).toFixed(0)}K monthly but you only have ₹{(metrics.availableForSavings / 1000).toFixed(0)}K available.
                </span>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button onClick={onResourceAllocation} className="flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Resource Allocation
        </Button>
        <Button variant="outline" onClick={onPriorityReorder} className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          Reorder Priorities
        </Button>
        <div className="flex items-center gap-2 ml-auto">
          <Filter className="w-4 h-4" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'active' | 'completed' | 'paused')}
            className="px-3 py-1 border rounded text-sm"
          >
            <option value="all">All Goals</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="paused">Paused</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'priority' | 'progress' | 'deadline' | 'amount')}
            className="px-3 py-1 border rounded text-sm"
          >
            <option value="priority">Sort by Priority</option>
            <option value="progress">Sort by Progress</option>
            <option value="deadline">Sort by Deadline</option>
            <option value="amount">Sort by Amount</option>
          </select>
        </div>
      </div>

      {/* Analytics Dashboard */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Priority Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={priorityDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      dataKey="value"
                    >
                      {priorityDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1 mt-2">
                  {priorityDistribution.map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded"
                          style={{ backgroundColor: item.color }}
                        />
                        <span>{item.name}</span>
                      </div>
                      <span className="font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Progress Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={progressDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      dataKey="value"
                    >
                      {progressDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1 mt-2">
                  {progressDistribution.map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded"
                          style={{ backgroundColor: item.color }}
                        />
                        <span>{item.name}</span>
                      </div>
                      <span className="font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Goal Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={statusDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" fill="#8884d8">
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          {/* Detailed goal list will go here */}
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          {/* Progress tracking will go here */}
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          {/* Timeline view will go here */}
        </TabsContent>
      </Tabs>

      {/* Goal List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Goals ({filteredGoals.length})
            {filter !== 'all' && (
              <Badge variant="outline" className="ml-2">
                {filter}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredGoals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No goals found for the selected filter.</p>
              </div>
            ) : (
              filteredGoals.map((goal) => {
                const progressPercentage = (goal.currentAmount / goal.targetAmount) * 100;
                const daysRemaining = goal.daysRemaining;

                return (
                  <div
                    key={goal.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => onGoalSelect?.(goal.id)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getGoalStatusIcon(goal)}
                        <div>
                          <h4 className="font-medium">{goal.name}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="outline" className="text-xs">
                              Priority {goal.priority}
                            </Badge>
                            <span>•</span>
                            <span>{getGoalStatusText(goal)}</span>
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>₹{goal.currentAmount.toLocaleString()} / ₹{goal.targetAmount.toLocaleString()}</span>
                        <span>{progressPercentage.toFixed(1)}%</span>
                      </div>
                      <Progress value={Math.min(progressPercentage, 100)} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Target: {format(new Date(goal.targetDate), 'MMM dd, yyyy')}</span>
                        <span>
                          {daysRemaining > 0
                            ? `${daysRemaining} days remaining`
                            : daysRemaining === 0
                            ? 'Due today'
                            : `${Math.abs(daysRemaining)} days overdue`
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
