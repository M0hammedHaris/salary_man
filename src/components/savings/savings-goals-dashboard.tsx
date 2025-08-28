'use client';

import { useState } from 'react';
import { Plus, Settings, BarChart3, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { GoalCreationForm } from './goal-creation-form';
import { GoalProgressCard } from './goal-progress-card';
import { GoalAnalytics } from './goal-analytics';
import { MultiGoalOverview } from './multi-goal-overview';
import { ResourceAllocationHelper } from './resource-allocation-helper';
import { PriorityRanking } from './priority-ranking';
import type { GoalWithProgress } from '@/lib/types/savings';

interface SavingsGoalsDashboardProps {
  goals: GoalWithProgress[];
  monthlyIncome?: number;
  monthlyExpenses?: number;
  onGoalCreated: () => void;
  onGoalUpdated: () => void;
  onGoalDeleted: () => void;
  onGoalPriorityUpdated?: (goalId: string, newPriority: number) => void;
}

export function SavingsGoalsDashboard({
  goals,
  monthlyIncome = 0,
  monthlyExpenses = 0,
  onGoalCreated,
  onGoalUpdated,
  onGoalPriorityUpdated,
}: SavingsGoalsDashboardProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isResourceDialogOpen, setIsResourceDialogOpen] = useState(false);
  const [isPriorityDialogOpen, setIsPriorityDialogOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);

  // Categorize goals by status
  const activeGoals = goals.filter(goal => goal.status === 'active');
  const completedGoals = goals.filter(goal => goal.status === 'completed');
  const pausedGoals = goals.filter(goal => goal.status === 'paused');

  const handleGoalCreated = () => {
    setIsCreateDialogOpen(false);
    onGoalCreated();
  };

  const handleGoalSelect = (goalId: string) => {
    setSelectedGoalId(goalId);
    // You could navigate to a detailed goal view here
  };

  const handleResourceAllocation = () => {
    setIsResourceDialogOpen(true);
  };

  const handlePriorityReorder = () => {
    setIsPriorityDialogOpen(true);
  };

  const handlePriorityUpdate = (goalId: string, newPriority: number) => {
    onGoalPriorityUpdated?.(goalId, newPriority);
  };

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Savings Goals</h1>
          <p className="text-muted-foreground">
            Track your progress toward financial objectives
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Savings Goal</DialogTitle>
            </DialogHeader>
            <GoalCreationForm onSuccess={handleGoalCreated} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Enhanced Dashboard Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="active">
            Active ({activeGoals.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedGoals.length})
          </TabsTrigger>
          <TabsTrigger value="paused">
            Paused ({pausedGoals.length})
          </TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="planning">Planning</TabsTrigger>
        </TabsList>

        {/* Multi-Goal Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <MultiGoalOverview
            goals={goals}
            monthlyIncome={monthlyIncome}
            monthlyExpenses={monthlyExpenses}
            onGoalSelect={handleGoalSelect}
            onResourceAllocation={handleResourceAllocation}
            onPriorityReorder={handlePriorityReorder}
          />
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          {activeGoals.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold">No Active Goals</h3>
                  <p className="text-muted-foreground">
                    Create your first savings goal to start tracking your progress.
                  </p>
                  <Button 
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="mt-4"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Goal
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeGoals.map((goal) => (
                <GoalProgressCard
                  key={goal.id}
                  goal={goal}
                  onUpdate={onGoalUpdated}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedGoals.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold">No Completed Goals</h3>
                  <p className="text-muted-foreground">
                    Your completed savings goals will appear here.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {completedGoals.map((goal) => (
                <GoalProgressCard
                  key={goal.id}
                  goal={goal}
                  onUpdate={onGoalUpdated}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="paused" className="space-y-4">
          {pausedGoals.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold">No Paused Goals</h3>
                  <p className="text-muted-foreground">
                    Goals you&apos;ve temporarily paused will appear here.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pausedGoals.map((goal) => (
                <GoalProgressCard
                  key={goal.id}
                  goal={goal}
                  onUpdate={onGoalUpdated}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <GoalAnalytics goals={goals} />
        </TabsContent>

        {/* Planning Tab */}
        <TabsContent value="planning" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Resource Allocation</h3>
                <ResourceAllocationHelper
                  goals={activeGoals}
                  monthlyIncome={monthlyIncome}
                  monthlyExpenses={monthlyExpenses}
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Priority Management</h3>
                <PriorityRanking
                  goals={goals}
                  onPriorityUpdate={handlePriorityUpdate}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Resource Allocation Dialog */}
      <Dialog open={isResourceDialogOpen} onOpenChange={setIsResourceDialogOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Resource Allocation Helper</DialogTitle>
          </DialogHeader>
          <ResourceAllocationHelper
            goals={activeGoals}
            monthlyIncome={monthlyIncome}
            monthlyExpenses={monthlyExpenses}
          />
        </DialogContent>
      </Dialog>

      {/* Priority Ranking Dialog */}
      <Dialog open={isPriorityDialogOpen} onOpenChange={setIsPriorityDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Goal Priority Ranking</DialogTitle>
          </DialogHeader>
          <PriorityRanking
            goals={goals}
            onPriorityUpdate={handlePriorityUpdate}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
