'use client';

import { useMemo } from 'react';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import type { GoalWithProgress } from '@/lib/types/savings';

interface SavingsRateTrendProps {
  goal: GoalWithProgress;
  className?: string;
}

export function SavingsRateTrend({ goal, className }: SavingsRateTrendProps) {
  const trendData = useMemo(() => {
    // Generate last 30 days of data
    const endDate = new Date();
    const startDate = subDays(endDate, 29); // 30 days total
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    
    // Calculate required daily savings rate
    const daysRemaining = Math.max(1, Math.ceil((new Date(goal.targetDate).getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24)));
    const requiredDailyRate = (goal.targetAmount - goal.currentAmount) / daysRemaining;
    
    // Generate simulated daily savings data (in reality, this would come from transaction history)
    const data = days.map((day, index) => {
      const dayStr = format(day, 'MMM dd');
      
      // Simulate variable savings rate with some trend
      const baseRate = goal.actualDailySavings || requiredDailyRate;
      const variation = (Math.sin(index * 0.2) * 0.3 + Math.random() * 0.4 - 0.2); // -20% to +30% variation
      const actualRate = Math.max(0, baseRate * (1 + variation));
      
      // Add some trend over time
      const trendFactor = 1 + (index / days.length) * 0.1; // 10% improvement over 30 days
      const dailySavings = actualRate * trendFactor;
      
      return {
        date: dayStr,
        fullDate: day,
        actualRate: Math.round(dailySavings),
        requiredRate: Math.round(requiredDailyRate),
        weeklyAverage: Math.round(dailySavings), // Simplified for demo
        trend: dailySavings > requiredDailyRate ? 'above' : 'below',
      };
    });
    
    // Calculate 7-day moving average
    const dataWithAverage = data.map((item, index) => {
      const start = Math.max(0, index - 6);
      const slice = data.slice(start, index + 1);
      const average = slice.reduce((sum, d) => sum + d.actualRate, 0) / slice.length;
      
      return {
        ...item,
        weeklyAverage: Math.round(average),
      };
    });
    
    return dataWithAverage;
  }, [goal]);

  const trendAnalysis = useMemo(() => {
    if (trendData.length < 2) return { direction: 'stable', change: 0 };
    
    const recentData = trendData.slice(-7); // Last 7 days
    const olderData = trendData.slice(-14, -7); // Previous 7 days
    
    const recentAverage = recentData.reduce((sum, d) => sum + d.actualRate, 0) / recentData.length;
    const olderAverage = olderData.reduce((sum, d) => sum + d.actualRate, 0) / olderData.length;
    
    const change = ((recentAverage - olderAverage) / olderAverage) * 100;
    
    let direction: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (Math.abs(change) > 5) {
      direction = change > 0 ? 'increasing' : 'decreasing';
    }
    
    return { direction, change: Math.abs(change) };
  }, [trendData]);

  const getTrendIcon = () => {
    switch (trendAnalysis.direction) {
      case 'increasing':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'decreasing':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendText = () => {
    switch (trendAnalysis.direction) {
      case 'increasing':
        return `+${trendAnalysis.change.toFixed(1)}% vs last week`;
      case 'decreasing':
        return `-${trendAnalysis.change.toFixed(1)}% vs last week`;
      default:
        return 'Stable trend';
    }
  };

  const currentAverage = trendData.length > 0 
    ? trendData.slice(-7).reduce((sum, d) => sum + d.actualRate, 0) / 7
    : 0;

  const requiredRate = goal.requiredDailySavings;
  const performance = requiredRate > 0 ? (currentAverage / requiredRate) * 100 : 0;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Savings Rate Trend</CardTitle>
          <div className="flex items-center gap-2">
            {getTrendIcon()}
            <Badge variant="outline">
              {getTrendText()}
            </Badge>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          Daily savings progress over the last 30 days
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64 mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="averageGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                stroke="#666"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis 
                stroke="#666"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `₹${value}`}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value: number, name: string) => [
                  `₹${value}`,
                  name === 'actualRate' ? 'Daily Savings' :
                  name === 'weeklyAverage' ? '7-Day Average' : 'Required Rate'
                ]}
                labelFormatter={(label) => `Date: ${label}`}
              />
              
              {/* Required rate reference line */}
              <ReferenceLine 
                y={requiredRate} 
                stroke="#ef4444" 
                strokeDasharray="5 5" 
                strokeWidth={2}
                label={{ value: "Required Rate", position: "top" }}
              />
              
              {/* Actual daily savings */}
              <Area
                type="monotone"
                dataKey="actualRate"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#savingsGradient)"
                dot={false}
              />
              
              {/* 7-day moving average */}
              <Area
                type="monotone"
                dataKey="weeklyAverage"
                stroke="#10b981"
                strokeWidth={3}
                fill="url(#averageGradient)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        {/* Performance Summary */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">7-Day Average</p>
            <p className="text-lg font-semibold">₹{Math.round(currentAverage)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Required Rate</p>
            <p className="text-lg font-semibold">₹{Math.round(requiredRate)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Performance</p>
            <p className={`text-lg font-semibold ${
              performance >= 100 ? 'text-green-600' : 
              performance >= 80 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {performance.toFixed(0)}%
            </p>
          </div>
        </div>
        
        {/* Insights */}
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <h4 className="text-sm font-medium mb-2">Insights</h4>
          <div className="space-y-1 text-sm text-muted-foreground">
            {performance >= 100 ? (
              <p>✓ Excellent! You&apos;re saving more than required to reach your goal.</p>
            ) : performance >= 80 ? (
              <p>⚠ You&apos;re close to your target rate. Consider increasing savings slightly.</p>
            ) : (
              <p>⚠ Your savings rate is below target. You may need to adjust your goal or increase savings.</p>
            )}
            
            {trendAnalysis.direction === 'increasing' && (
              <p>📈 Your savings rate is improving - keep up the good work!</p>
            )}
            
            {trendAnalysis.direction === 'decreasing' && (
              <p>📉 Your savings rate has decreased recently. Consider reviewing your budget.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
