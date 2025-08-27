'use client';

import React from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Minus, Target, Calendar } from 'lucide-react';
import type { NetWorthData } from '@/lib/types/analytics';

interface NetWorthTrackerProps {
  data: NetWorthData[];
  className?: string;
  showGoals?: boolean;
  chartType?: 'line' | 'area';
  timeframe?: 'month' | 'quarter' | 'year';
}

// Custom formatter for currency values
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Custom formatter for compact currency (e.g., ₹1.2K, ₹1.5M)
const formatCompactCurrency = (value: number): string => {
  if (Math.abs(value) >= 10000000) {
    return '₹' + (value / 10000000).toFixed(1) + 'Cr';
  }
  if (Math.abs(value) >= 100000) {
    return '₹' + (value / 100000).toFixed(1) + 'L';
  }
  if (Math.abs(value) >= 1000) {
    return '₹' + (value / 1000).toFixed(1) + 'K';
  }
  return '₹' + value.toFixed(0);
};

// Custom tooltip component
interface TooltipPayload {
  color: string;
  dataKey: string;
  value: number;
}

interface TooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 border border-border rounded-lg shadow-lg">
        <p className="font-medium text-sm mb-2">{`Date: ${label}`}</p>
        {payload.map((entry, index: number) => (
          <div key={index} className="text-sm">
            <span className="font-medium" style={{ color: entry.color }}>
              {entry.dataKey === 'netWorth' ? 'Net Worth' : 
               entry.dataKey === 'assets' ? 'Total Assets' :
               entry.dataKey === 'liabilities' ? 'Total Liabilities' : entry.dataKey}:
            </span>
            <span className="ml-2">{formatCurrency(entry.value)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Calculate net worth growth
const calculateNetWorthGrowth = (data: NetWorthData[]) => {
  if (data.length < 2) return { growth: 0, growthRate: 0 };
  
  const latest = data[data.length - 1];
  const previous = data[data.length - 2];
  
  const growth = latest.netWorth - previous.netWorth;
  const growthRate = (growth / previous.netWorth) * 100;
  
  return { growth, growthRate };
};

// Get trend direction
const getTrendDirection = (growthRate: number): 'up' | 'down' | 'stable' => {
  if (Math.abs(growthRate) < 0.1) return 'stable';
  return growthRate > 0 ? 'up' : 'down';
};

export function NetWorthTracker({ 
  data, 
  className = '',
  showGoals = true,
  chartType = 'area',
  timeframe = 'month'
}: NetWorthTrackerProps) {
  if (!data.length) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Net Worth Tracker
          </CardTitle>
          <CardDescription>No net worth data available for the selected period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            No data to display
          </div>
        </CardContent>
      </Card>
    );
  }

  const { growth, growthRate } = calculateNetWorthGrowth(data);
  const trend = getTrendDirection(growthRate);
  const currentNetWorth = data[data.length - 1]?.netWorth || 0;
  const totalAssets = data[data.length - 1]?.assets || 0;
  const totalLiabilities = data[data.length - 1]?.liabilities || 0;
  
  // Sample goal line (could be configurable)
  const goalAmount = Math.max(currentNetWorth * 1.2, 1000000); // 20% above current or 10L minimum

  const Chart = chartType === 'area' ? AreaChart : LineChart;
  
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Net Worth Tracker
            </CardTitle>
            <CardDescription>
              Track your overall financial growth over time
            </CardDescription>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold">{formatCompactCurrency(currentNetWorth)}</div>
            <div className="flex items-center gap-1 text-sm">
              {trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
              {trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
              {trend === 'stable' && <Minus className="h-4 w-4 text-gray-500" />}
              <span className={`font-medium ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
                {growth > 0 ? '+' : ''}{formatCompactCurrency(growth)} ({growthRate > 0 ? '+' : ''}{growthRate.toFixed(1)}%)
              </span>
            </div>
          </div>
        </div>
        
        {/* Asset/Liability Breakdown */}
        <div className="flex flex-wrap gap-2 mt-3">
          <Badge variant="default" className="text-xs">
            Assets: {formatCompactCurrency(totalAssets)}
          </Badge>
          <Badge variant="outline" className="text-xs">
            Liabilities: {formatCompactCurrency(totalLiabilities)}
          </Badge>
          {showGoals && (
            <Badge variant="secondary" className="text-xs flex items-center gap-1">
              <Target className="h-3 w-3" />
              Goal: {formatCompactCurrency(goalAmount)}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <Chart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              stroke="#666"
              fontSize={12}
              tickFormatter={(value) => {
                const date = new Date(value);
                if (timeframe === 'year') {
                  return date.toLocaleDateString('en-IN', { year: 'numeric' });
                }
                if (timeframe === 'quarter') {
                  return date.toLocaleDateString('en-IN', { 
                    month: 'short', 
                    year: '2-digit' 
                  });
                }
                return date.toLocaleDateString('en-IN', { 
                  month: 'short', 
                  day: 'numeric' 
                });
              }}
            />
            <YAxis 
              stroke="#666"
              fontSize={12}
              tickFormatter={formatCompactCurrency}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            {/* Goal reference line */}
            {showGoals && (
              <ReferenceLine 
                y={goalAmount} 
                stroke="#8b5cf6" 
                strokeDasharray="8 8"
                label={{ value: "Goal", position: "top" }}
              />
            )}
            
            {chartType === 'area' ? (
              <>
                <Area
                  type="monotone"
                  dataKey="assets"
                  stackId="1"
                  stroke="#22c55e"
                  fill="#22c55e"
                  fillOpacity={0.6}
                  name="Total Assets"
                />
                <Area
                  type="monotone"
                  dataKey="liabilities"
                  stackId="2"
                  stroke="#ef4444"
                  fill="#ef4444"
                  fillOpacity={0.6}
                  name="Total Liabilities"
                />
                <Line
                  type="monotone"
                  dataKey="netWorth"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 5 }}
                  activeDot={{ r: 7, stroke: '#3b82f6', strokeWidth: 2 }}
                  name="Net Worth"
                />
              </>
            ) : (
              <>
                <Line
                  type="monotone"
                  dataKey="assets"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
                  name="Total Assets"
                />
                <Line
                  type="monotone"
                  dataKey="liabilities"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                  name="Total Liabilities"
                />
                <Line
                  type="monotone"
                  dataKey="netWorth"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 5 }}
                  activeDot={{ r: 7, stroke: '#3b82f6', strokeWidth: 2 }}
                  name="Net Worth"
                />
              </>
            )}
          </Chart>
        </ResponsiveContainer>
        
        {/* Quick Actions */}
        <div className="flex justify-between items-center mt-4 pt-4 border-t">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="text-xs">
              <Calendar className="h-3 w-3 mr-1" />
              Set Goal
            </Button>
            <Button variant="outline" size="sm" className="text-xs">
              Export Data
            </Button>
          </div>
          
          <div className="text-xs text-muted-foreground">
            Last updated: {new Date(data[data.length - 1]?.date).toLocaleDateString('en-IN')}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Simplified version for smaller displays
export function SimpleNetWorthTracker({ 
  data, 
  className = '' 
}: Omit<NetWorthTrackerProps, 'showGoals' | 'chartType' | 'timeframe'>) {
  return (
    <NetWorthTracker 
      data={data} 
      className={className}
      showGoals={false}
      chartType="line"
      timeframe="month"
    />
  );
}

export default NetWorthTracker;
