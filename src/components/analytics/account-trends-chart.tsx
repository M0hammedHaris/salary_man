'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { AccountTrend } from '@/lib/types/analytics';

interface AccountTrendsChartProps {
  data: AccountTrend[];
  className?: string;
  showGrowthBadges?: boolean;
  chartType?: 'line' | 'area';
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
  if (Math.abs(value) >= 1e6) {
    return '₹' + (value / 1e6).toFixed(1) + 'M';
  }
  if (Math.abs(value) >= 1e3) {
    return '₹' + (value / 1e3).toFixed(1) + 'K';
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
      <div className="bg-white p-3 border border-border rounded-lg shadow-lg">
        <p className="font-medium">{`Date: ${label}`}</p>
        {payload.map((entry, index: number) => (
          <p key={index} style={{ color: entry.color }}>
            {`${entry.dataKey}: ${formatCurrency(entry.value)}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Account colors for different account types
const getAccountColor = (accountName: string): string => {
  const colors = [
    '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1',
    '#d084d0', '#ffb347', '#87ceeb', '#dda0dd', '#98fb98'
  ];
  
  // Simple hash function to assign consistent colors
  let hash = 0;
  for (let i = 0; i < accountName.length; i++) {
    hash = accountName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

// Transform data for chart display
const transformAccountTrendsData = (trends: AccountTrend[]) => {
  if (!trends.length) return [];

  // Get all unique dates
  const allDates = [...new Set(trends.flatMap(trend => 
    trend.data.map(point => point.date)
  ))].sort();

  // Create chart data with all accounts for each date
  return allDates.map(date => {
    const dataPoint: Record<string, string | number | null> = { date };
    
    trends.forEach(trend => {
      const balancePoint = trend.data.find(point => point.date === date);
      dataPoint[trend.accountName] = balancePoint?.balance || null;
    });
    
    return dataPoint;
  });
};

export function AccountTrendsChart({ 
  data, 
  className = '',
  showGrowthBadges = true,
  chartType = 'line' 
}: AccountTrendsChartProps) {
  const chartData = transformAccountTrendsData(data);
  
  if (!data.length) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Account Trends</CardTitle>
          <CardDescription>No account data available for the selected period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            No data to display
          </div>
        </CardContent>
      </Card>
    );
  }

  const Chart = chartType === 'area' ? AreaChart : LineChart;
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Account Balance Trends</CardTitle>
        <CardDescription>
          Track how your account balances change over time
        </CardDescription>
        
        {showGrowthBadges && (
          <div className="flex flex-wrap gap-2 mt-2">
            {data.map((trend) => {
              const growthRate = trend.growth || 0;
              const isPositive = growthRate > 0;
              const isNegative = growthRate < 0;
              
              return (
                <Badge
                  key={trend.accountName}
                  variant={isPositive ? "default" : isNegative ? "destructive" : "secondary"}
                  className="text-xs"
                >
                  {trend.accountName}: {growthRate > 0 ? '+' : ''}{growthRate.toFixed(1)}%
                </Badge>
              );
            })}
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <Chart 
            data={chartData} 
            margin={{ 
              top: 20, 
              right: window.innerWidth < 768 ? 10 : 30, 
              left: window.innerWidth < 768 ? 10 : 20, 
              bottom: window.innerWidth < 768 ? 60 : 5 
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              stroke="#666"
              fontSize={window.innerWidth < 768 ? 10 : 12}
              angle={window.innerWidth < 768 ? -45 : 0}
              textAnchor={window.innerWidth < 768 ? "end" : "middle"}
              height={window.innerWidth < 768 ? 60 : 30}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString('en-IN', { 
                  month: 'short', 
                  day: window.innerWidth < 768 ? undefined : 'numeric' 
                });
              }}
            />
            <YAxis 
              stroke="#666"
              fontSize={window.innerWidth < 768 ? 10 : 12}
              tickFormatter={formatCompactCurrency}
              width={window.innerWidth < 768 ? 60 : 80}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ 
                fontSize: window.innerWidth < 768 ? '12px' : '14px',
                paddingTop: '10px'
              }}
            />
            
            {data.map((trend) => {
              const color = getAccountColor(trend.accountName);
              
              if (chartType === 'area') {
                return (
                  <Area
                    key={trend.accountName}
                    type="monotone"
                    dataKey={trend.accountName}
                    stroke={color}
                    fill={color}
                    fillOpacity={0.3}
                    strokeWidth={2}
                    connectNulls={false}
                  />
                );
              }
              
              return (
                <Line
                  key={trend.accountName}
                  type="monotone"
                  dataKey={trend.accountName}
                  stroke={color}
                  strokeWidth={2}
                  dot={{ fill: color, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: color, strokeWidth: 2 }}
                  connectNulls={false}
                />
              );
            })}
          </Chart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Simplified version for smaller displays
export function SimpleAccountTrendsChart({ 
  data, 
  className = '' 
}: Omit<AccountTrendsChartProps, 'showGrowthBadges' | 'chartType'>) {
  return (
    <AccountTrendsChart 
      data={data} 
      className={className}
      showGrowthBadges={false}
      chartType="line"
    />
  );
}

export default AccountTrendsChart;
