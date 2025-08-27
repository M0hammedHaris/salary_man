"use client";

import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Bar,
  ComposedChart,
} from 'recharts';
import { formatCurrency } from '@/lib/utils/analytics-utils';
import type { CashFlowData } from '@/lib/types/analytics';

interface CashFlowChartProps {
  data: CashFlowData[];
  height?: number;
  showNetFlow?: boolean;
  className?: string;
}

export function CashFlowChart({ 
  data, 
  height = 400, 
  showNetFlow = true,
  className 
}: CashFlowChartProps) {
  const formatTooltipValue = (value: number, name: string) => {
    const formattedValue = formatCurrency(value);
    
    const labelMap: { [key: string]: string } = {
      income: 'Income',
      expenses: 'Expenses',
      netFlow: 'Net Cash Flow',
    };
    
    return [formattedValue, labelMap[name] || name];
  };

  const formatTooltipLabel = (label: string) => {
    try {
      const date = new Date(label);
      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return label;
    }
  };

  const formatXAxisLabel = (value: string) => {
    try {
      const date = new Date(value);
      return date.toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return value;
    }
  };

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="date"
            tickFormatter={formatXAxisLabel}
            fontSize={12}
            tickMargin={10}
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
            formatter={formatTooltipValue}
            labelFormatter={formatTooltipLabel}
            contentStyle={{
              backgroundColor: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              color: 'hsl(var(--popover-foreground))',
            }}
            labelStyle={{
              color: 'hsl(var(--popover-foreground))',
              fontWeight: 'bold',
            }}
          />
          <Legend 
            wrapperStyle={{
              paddingTop: '20px',
            }}
          />
          
          {/* Income as bars */}
          <Bar
            dataKey="income"
            name="income"
            fill="hsl(var(--chart-1))"
            fillOpacity={0.8}
            radius={[2, 2, 0, 0]}
          />
          
          {/* Expenses as bars (negative values) */}
          <Bar
            dataKey="expenses"
            name="expenses"
            fill="hsl(var(--chart-2))"
            fillOpacity={0.8}
            radius={[2, 2, 0, 0]}
          />
          
          {/* Net flow as a line */}
          {showNetFlow && (
            <Line
              type="monotone"
              dataKey="netFlow"
              name="netFlow"
              stroke="hsl(var(--chart-3))"
              strokeWidth={3}
              dot={{ fill: 'hsl(var(--chart-3))', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

interface SimpleCashFlowChartProps {
  data: CashFlowData[];
  height?: number;
  className?: string;
}

export function SimpleCashFlowChart({ 
  data, 
  height = 300,
  className 
}: SimpleCashFlowChartProps) {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="date"
            tickFormatter={(value) => {
              try {
                const date = new Date(value);
                return date.toLocaleDateString('en-IN', {
                  month: 'short',
                  day: 'numeric',
                });
              } catch {
                return value;
              }
            }}
            fontSize={12}
            tickMargin={10}
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
            formatter={(value: number, name: string) => {
              const formattedValue = formatCurrency(value);
              const labelMap: { [key: string]: string } = {
                income: 'Income',
                expenses: 'Expenses',
                netFlow: 'Net Cash Flow',
              };
              return [formattedValue, labelMap[name] || name];
            }}
            labelFormatter={(label: string) => {
              try {
                const date = new Date(label);
                return date.toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                });
              } catch {
                return label;
              }
            }}
            contentStyle={{
              backgroundColor: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              color: 'hsl(var(--popover-foreground))',
            }}
          />
          <Legend />
          
          <Line
            type="monotone"
            dataKey="income"
            stroke="hsl(var(--chart-1))"
            strokeWidth={2}
            dot={{ fill: 'hsl(var(--chart-1))', strokeWidth: 2, r: 3 }}
            name="Income"
          />
          
          <Line
            type="monotone"
            dataKey="expenses"
            stroke="hsl(var(--chart-2))"
            strokeWidth={2}
            dot={{ fill: 'hsl(var(--chart-2))', strokeWidth: 2, r: 3 }}
            name="Expenses"
          />
          
          <Line
            type="monotone"
            dataKey="netFlow"
            stroke="hsl(var(--chart-3))"
            strokeWidth={3}
            dot={{ fill: 'hsl(var(--chart-3))', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, strokeWidth: 0 }}
            name="Net Cash Flow"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
