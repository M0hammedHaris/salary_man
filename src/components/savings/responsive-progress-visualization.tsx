'use client';

import { useState } from 'react';
import { ChevronDown, BarChart3, TrendingUp, Calendar } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

import { GoalTimelineChart } from './goal-timeline-chart';
import { GoalProgressTracker } from './goal-progress-tracker';
import { SavingsRateTrend } from './savings-rate-trend';

import type { GoalWithProgress } from '@/lib/types/savings';

interface ResponsiveProgressVisualizationProps {
  goal: GoalWithProgress;
  className?: string;
}

export function ResponsiveProgressVisualization({ 
  goal, 
  className 
}: ResponsiveProgressVisualizationProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isTimelineExpanded, setIsTimelineExpanded] = useState(false);
  const [isTrendExpanded, setIsTrendExpanded] = useState(false);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Mobile Responsive Tabs */}
      <div className="block lg:hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="text-xs">
              <BarChart3 className="h-3 w-3 mr-1" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="timeline" className="text-xs">
              <Calendar className="h-3 w-3 mr-1" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="trend" className="text-xs">
              <TrendingUp className="h-3 w-3 mr-1" />
              Trend
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-4">
            <GoalProgressTracker goal={goal} />
          </TabsContent>
          
          <TabsContent value="timeline" className="mt-4">
            <GoalTimelineChart goal={goal} />
          </TabsContent>
          
          <TabsContent value="trend" className="mt-4">
            <SavingsRateTrend goal={goal} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Desktop Grid Layout */}
      <div className="hidden lg:block">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Progress Tracker - Always Visible */}
          <div className="xl:col-span-1">
            <GoalProgressTracker goal={goal} />
          </div>
          
          {/* Timeline Chart - Always Visible on Desktop */}
          <div className="xl:col-span-1">
            <GoalTimelineChart goal={goal} />
          </div>
          
          {/* Savings Rate Trend - Full Width */}
          <div className="xl:col-span-2">
            <SavingsRateTrend goal={goal} />
          </div>
        </div>
      </div>

      {/* Tablet Collapsible Layout */}
      <div className="hidden md:block lg:hidden space-y-4">
        {/* Progress Tracker - Always Expanded */}
        <GoalProgressTracker goal={goal} />
        
        {/* Timeline Chart - Collapsible */}
        <Collapsible 
          open={isTimelineExpanded} 
          onOpenChange={setIsTimelineExpanded}
        >
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Progress Timeline
                  </CardTitle>
                  <Button variant="ghost" size="sm">
                    <ChevronDown 
                      className={`h-4 w-4 transition-transform ${
                        isTimelineExpanded ? 'rotate-180' : ''
                      }`} 
                    />
                  </Button>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="h-64">
                  <GoalTimelineChart goal={goal} className="h-full" />
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
        
        {/* Savings Rate Trend - Collapsible */}
        <Collapsible 
          open={isTrendExpanded} 
          onOpenChange={setIsTrendExpanded}
        >
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Savings Rate Analysis
                  </CardTitle>
                  <Button variant="ghost" size="sm">
                    <ChevronDown 
                      className={`h-4 w-4 transition-transform ${
                        isTrendExpanded ? 'rotate-180' : ''
                      }`} 
                    />
                  </Button>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <SavingsRateTrend goal={goal} />
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>

      {/* Compact Summary for Small Screens */}
      <div className="block md:hidden">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Progress Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center">
                <p className="text-muted-foreground">Progress</p>
                <p className="text-lg font-semibold">
                  {((goal.currentAmount / goal.targetAmount) * 100).toFixed(0)}%
                </p>
              </div>
              <div className="text-center">
                <p className="text-muted-foreground">Remaining</p>
                <p className="text-lg font-semibold">
                  ₹{(goal.targetAmount - goal.currentAmount).toLocaleString()}
                </p>
              </div>
              <div className="text-center">
                <p className="text-muted-foreground">Daily Target</p>
                <p className="text-lg font-semibold">
                  ₹{Math.round(goal.requiredDailySavings)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-muted-foreground">Days Left</p>
                <p className="text-lg font-semibold">
                  {Math.max(0, Math.ceil(
                    (new Date(goal.targetDate).getTime() - new Date().getTime()) / 
                    (1000 * 60 * 60 * 24)
                  ))}
                </p>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => setActiveTab('overview')}
              >
                View Detailed Analysis
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
