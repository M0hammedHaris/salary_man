'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GoalCreationForm } from './goal-creation-form';
import { GoalProgressCard } from './goal-progress-card';
import { GoalAnalytics } from './goal-analytics';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import type { GoalWithProgress } from '@/lib/types/savings';

interface SavingsGoalsDashboardProps {
  goals: GoalWithProgress[];
  onGoalCreated: () => void;
  onGoalUpdated: () => void;
  onGoalDeleted: () => void;
}

export function SavingsGoalsDashboard({
  goals,
  onGoalCreated,
  onGoalUpdated,
}: SavingsGoalsDashboardProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Categorize goals by status
  const activeGoals = goals.filter(goal => goal.status === 'active');
  const completedGoals = goals.filter(goal => goal.status === 'completed');
  const pausedGoals = goals.filter(goal => goal.status === 'paused');

  const handleGoalCreated = () => {
    setIsCreateDialogOpen(false);
    onGoalCreated();
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

      {/* Analytics Overview */}
      <GoalAnalytics goals={goals} />

      {/* Goals Tabs */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">
            Active Goals ({activeGoals.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedGoals.length})
          </TabsTrigger>
          <TabsTrigger value="paused">
            Paused ({pausedGoals.length})
          </TabsTrigger>
        </TabsList>

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
      </Tabs>
    </div>
  );
}
