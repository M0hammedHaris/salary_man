'use client';

import { useMemo } from 'react';
import { format, eachMonthOfInterval } from 'date-fns';
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import type { GoalWithProgress } from '@/lib/types/savings';

interface GoalTimelineChartProps {
  goal: GoalWithProgress;
  className?: string;
}

export function GoalTimelineChart({ goal, className }: GoalTimelineChartProps) {
  const chartData = useMemo(() => {
    const startDate = new Date(goal.createdAt);
    const endDate = new Date(goal.targetDate);
    const currentDate = new Date();
    
    // Generate monthly intervals from start to target date
    const months = eachMonthOfInterval({ start: startDate, end: endDate });
    
    // Calculate the ideal savings amount per month
    const monthsToTarget = months.length;
    const monthlyTarget = goal.targetAmount / monthsToTarget;
    
    // Generate timeline data
    const data = months.map((month, index) => {
      const monthStr = format(month, 'MMM yyyy');
      const monthsElapsed = index + 1;
      const idealAmount = monthlyTarget * monthsElapsed;
      
      // For past months, use actual progress based on current state
      // For future months, show projections
      const isCurrentOrPast = month <= currentDate;
      
      let actualAmount = 0;
      let projectedAmount = idealAmount;
      
      if (isCurrentOrPast) {
        // Simplified calculation - in reality, you'd want historical data
        const timeRatio = monthsElapsed / monthsToTarget;
        actualAmount = goal.currentAmount * (timeRatio / (currentDate.getTime() - startDate.getTime()) * (month.getTime() - startDate.getTime())) / (currentDate.getTime() - startDate.getTime());
        actualAmount = Math.min(actualAmount, goal.currentAmount);
      } else {
        // Future projection based on current savings rate
        const currentMonthsElapsed = Math.ceil((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
        const currentSavingsRate = currentMonthsElapsed > 0 ? goal.currentAmount / currentMonthsElapsed : goal.requiredDailySavings * 30;
        
        const futureMonths = index - currentMonthsElapsed;
        projectedAmount = goal.currentAmount + (currentSavingsRate * futureMonths);
      }
      
      return {
        month: monthStr,
        ideal: Math.round(idealAmount),
        actual: isCurrentOrPast ? Math.round(actualAmount) : null,
        projected: !isCurrentOrPast ? Math.round(projectedAmount) : null,
        target: index === months.length - 1 ? goal.targetAmount : null,
      };
    });
    
    return data;
  }, [goal]);

  const getStatusColor = () => {
    if (goal.isOnTrack) return 'text-green-600';
    if (goal.currentAmount / goal.targetAmount > 0.8) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusText = () => {
    if (goal.isOnTrack) return 'On Track';
    if (goal.currentAmount / goal.targetAmount > 0.8) return 'Slightly Behind';
    return 'Behind Schedule';
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Savings Timeline</CardTitle>
          <Badge variant="outline" className={getStatusColor()}>
            {getStatusText()}
          </Badge>
        </div>
        <div className="text-sm text-muted-foreground">
          Progress vs. ideal savings path for {goal.name}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="month" 
                stroke="#666"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="#666"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value: number, name: string) => [
                  `₹${value?.toLocaleString() || 0}`,
                  name === 'ideal' ? 'Ideal Progress' :
                  name === 'actual' ? 'Actual Progress' :
                  name === 'projected' ? 'Projected' : 'Target'
                ]}
                labelFormatter={(label) => `Month: ${label}`}
              />
              <Legend 
                wrapperStyle={{ fontSize: '12px' }}
                iconType="line"
              />
              
              {/* Ideal savings line */}
              <Line
                type="monotone"
                dataKey="ideal"
                stroke="#94a3b8"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="Ideal Progress"
              />
              
              {/* Actual progress line */}
              <Line
                type="monotone"
                dataKey="actual"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                connectNulls={false}
                name="Actual Progress"
              />
              
              {/* Projected future line */}
              <Line
                type="monotone"
                dataKey="projected"
                stroke="#10b981"
                strokeWidth={2}
                strokeDasharray="3 3"
                dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
                connectNulls={false}
                name="Projected"
              />
              
              {/* Target point */}
              <Line
                type="monotone"
                dataKey="target"
                stroke="#ef4444"
                strokeWidth={3}
                dot={{ fill: '#ef4444', strokeWidth: 2, r: 6 }}
                connectNulls={false}
                name="Target"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Current</p>
            <p className="text-lg font-semibold">₹{goal.currentAmount.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Target</p>
            <p className="text-lg font-semibold">₹{goal.targetAmount.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Daily Required</p>
            <p className="text-lg font-semibold">₹{Math.round(goal.requiredDailySavings)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
