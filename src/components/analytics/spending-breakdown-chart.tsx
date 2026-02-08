"use client";

import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { formatCurrency, formatPercentage } from '@/lib/utils/analytics-utils';
import type { SpendingCategory } from '@/lib/types/analytics';

interface SpendingBreakdownChartProps {
  data: SpendingCategory[];
  height?: number;
  chartType?: 'pie' | 'bar';
  className?: string;
}

export function SpendingBreakdownChart({
  data,
  height = 400,
  chartType = 'pie',
  className
}: SpendingBreakdownChartProps) {
  // Generate colors for pie chart
  const COLORS = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
    '#8884d8',
    '#82ca9d',
    '#ffc658',
    '#ff7c7c',
    '#8dd1e1',
    '#d084d0',
    '#87d068'
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomPieTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as SpendingCategory;
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-popover-foreground">{data.categoryName}</p>
          <p className="text-sm text-muted-foreground">
            {formatCurrency(data.amount)} ({formatPercentage(data.percentage)})
          </p>
        </div>
      );
    }
    return null;
  };

  const formatBarTooltip = (value: number, name: string) => {
    if (name === 'amount') {
      return [formatCurrency(value), 'Amount'];
    }
    return [value, name];
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomizedLabel = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percentage } = props;
    if (percentage < 5) return null; // Hide labels for small slices

    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${percentage.toFixed(1)}%`}
      </text>
    );
  };

  if (chartType === 'pie') {
    return (
      <div className={className}>
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={CustomizedLabel}
              outerRadius={Math.min(height * 0.35, 140)}
              fill="#8884d8"
              dataKey="amount"
              nameKey="categoryName"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.categoryColor || COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip content={CustomPieTooltip} />
            <Legend
              wrapperStyle={{
                paddingTop: '20px',
                fontSize: '12px',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Bar chart version
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 60,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis
            dataKey="categoryName"
            angle={-45}
            textAnchor="end"
            height={80}
            fontSize={11}

          />
          <YAxis
            tickFormatter={(value) => {
              // Compact formatting for chart Y-axis
              if (Math.abs(value) >= 100000) {
                return `₹${(value / 100000).toFixed(1)}L`;
              } else if (Math.abs(value) >= 1000) {
                return `₹${(value / 1000).toFixed(1)}K`;
              }
              return formatCurrency(value);
            }}
            fontSize={12}
            width={80}
          />
          <Tooltip
            formatter={formatBarTooltip}
            labelStyle={{
              color: 'hsl(var(--popover-foreground))',
              fontWeight: 'bold',
            }}
            contentStyle={{
              backgroundColor: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              color: 'hsl(var(--popover-foreground))',
            }}
          />
          <Bar
            dataKey="amount"
            fill="hsl(var(--chart-1))"
            radius={[4, 4, 0, 0]}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.categoryColor || COLORS[index % COLORS.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface SpendingBreakdownGridProps {
  data: SpendingCategory[];
  className?: string;
}

export function SpendingBreakdownGrid({ data, className }: SpendingBreakdownGridProps) {
  return (
    <div className={className}>
      <div className="grid gap-3">
        {data.map((category) => (
          <div
            key={category.categoryId}
            className="flex items-center justify-between p-3 rounded-lg border bg-card"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: category.categoryColor }}
              />
              <span className="font-medium text-sm">{category.categoryName}</span>
            </div>
            <div className="text-right">
              <div className="font-semibold text-sm">
                {formatCurrency(category.amount)}
              </div>
              <div className="text-xs text-muted-foreground">
                {formatPercentage(category.percentage)}
              </div>
            </div>
          </div>
        ))}

        {data.length === 0 && (
          <div className="flex items-center justify-center p-8 text-muted-foreground">
            <div className="text-center">
              <p className="text-sm">No spending data available</p>
              <p className="text-xs mt-1">Start making transactions to see your spending breakdown</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
