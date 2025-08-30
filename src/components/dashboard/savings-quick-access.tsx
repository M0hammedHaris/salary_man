"use client";

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Target, TrendingUp, ArrowRight, Trophy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SavingsQuickAccessProps {
  className?: string;
  activeGoalsCount?: number;
  totalProgress?: number;
  nextMilestone?: string;
}

export function SavingsQuickAccess({ 
  className,
  activeGoalsCount = 0,
  totalProgress = 0,
  nextMilestone = "First Quarter"
}: SavingsQuickAccessProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Savings Goals</CardTitle>
          </div>
          {activeGoalsCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {activeGoalsCount} Active
            </Badge>
          )}
        </div>
        <CardDescription>
          Track your financial goals and milestones
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Stats Preview */}
        {activeGoalsCount > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Progress
                </p>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-semibold">{totalProgress.toFixed(1)}%</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Next Milestone
                </p>
                <div className="flex items-center gap-1">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  <span className="text-xs font-semibold truncate">{nextMilestone}</span>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Overall Progress</span>
                <span>{totalProgress.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(totalProgress, 100)}%` }}
                />
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <Target className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-1">No active goals yet</p>
            <p className="text-xs text-muted-foreground">Start your financial planning journey</p>
          </div>
        )}

        {/* Features List */}
        <div className="space-y-2">
          <ul className="text-sm text-muted-foreground space-y-1">
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full" />
              Goal progress tracking
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full" />
              Milestone achievements
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full" />
              Resource allocation planning
            </li>
          </ul>
        </div>

        {/* CTA Button */}
        <Button asChild className="w-full">
          <Link href="/savings" className="flex items-center gap-2">
            {activeGoalsCount > 0 ? 'Manage Goals' : 'Create First Goal'}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
