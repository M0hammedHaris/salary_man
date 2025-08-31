'use client';

import { useState, useEffect } from 'react';
import { SavingsGoalsDashboard } from '@/components/savings/savings-goals-dashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import type { GoalWithProgress } from '@/lib/types/savings';

export default function SavingsPage() {
  const [goals, setGoals] = useState<GoalWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/savings-goals');
      if (!response.ok) {
        throw new Error('Failed to fetch savings goals');
      }
      const data = await response.json();
      setGoals(data.goals || []);
    } catch (error) {
      console.error('Error fetching goals:', error);
      setError(error instanceof Error ? error.message : 'Failed to load savings goals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleGoalCreated = () => {
    fetchGoals();
  };

  const handleGoalUpdated = () => {
    fetchGoals();
  };

  const handleGoalDeleted = () => {
    fetchGoals();
  };

  const handleGoalPriorityUpdated = async (goalId: string, newPriority: number) => {
    try {
      const response = await fetch(`/api/savings-goals/${goalId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priority: newPriority }),
      });

      if (!response.ok) {
        throw new Error('Failed to update goal priority');
      }

      // Update local state optimistically
      setGoals(prevGoals => 
        prevGoals.map(goal => 
          goal.id === goalId 
            ? { ...goal, priority: newPriority }
            : goal
        )
      );
    } catch (error) {
      console.error('Error updating goal priority:', error);
      // Refresh goals to ensure consistency
      fetchGoals();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <Skeleton className="h-9 w-96 mb-2" />
              <Skeleton className="h-6 w-[600px]" />
            </div>
            
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <Skeleton className="h-8 w-48" />
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-64" />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
                Savings Goals & Financial Planning
              </h1>
              <p className="text-muted-foreground text-lg">
                Track your progress, achieve milestones, and optimize your savings strategy
              </p>
            </div>
            
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error}. Please try refreshing the page.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
              Savings Goals & Financial Planning
            </h1>
            <p className="text-muted-foreground text-lg">
              Track your progress, achieve milestones, and optimize your savings strategy
            </p>
          </div>
          
          <SavingsGoalsDashboard 
            goals={goals}
            onGoalCreated={handleGoalCreated}
            onGoalUpdated={handleGoalUpdated}
            onGoalDeleted={handleGoalDeleted}
            onGoalPriorityUpdated={handleGoalPriorityUpdated}
          />
        </div>
      </div>
    </div>
  );
}
