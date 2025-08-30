'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Line,
  ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CreditCard } from 'lucide-react';
import type { CreditUtilization } from '@/lib/types/analytics';

interface CreditUtilizationChartProps {
  data: CreditUtilization[];
  className?: string;
  showAlerts?: boolean;
  chartType?: 'bar' | 'composed';
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

// Custom formatter for percentage
const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
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
        <p className="font-medium">{`Account: ${label}`}</p>
        {payload.map((entry, index: number) => {
          const isPercentage = entry.dataKey === 'utilizationRate';
          const formatter = isPercentage ? formatPercentage : formatCurrency;
          
          return (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.dataKey}: ${formatter(entry.value)}`}
            </p>
          );
        })}
      </div>
    );
  }
  return null;
};

// Transform data for chart display
const transformCreditUtilizationData = (utilizations: CreditUtilization[]) => {
  return utilizations.map(util => ({
    accountName: util.accountName,
    currentBalance: util.currentBalance,
    creditLimit: util.creditLimit,
    utilizationRate: util.utilizationRate,
    availableCredit: util.creditLimit - util.currentBalance,
  }));
};

// Determine risk level based on utilization rate
const getRiskLevel = (utilizationRate: number): { level: string; color: string; variant: "default" | "secondary" | "destructive" | "outline" } => {
  if (utilizationRate >= 90) return { level: 'Critical', color: '#ef4444', variant: 'destructive' };
  if (utilizationRate >= 70) return { level: 'High', color: '#f97316', variant: 'destructive' };
  if (utilizationRate >= 50) return { level: 'Medium', color: '#eab308', variant: 'outline' };
  if (utilizationRate >= 30) return { level: 'Low', color: '#22c55e', variant: 'default' };
  return { level: 'Very Low', color: '#10b981', variant: 'default' };
};

export function CreditUtilizationChart({ 
  data, 
  className = '',
  showAlerts = true,
  chartType = 'composed' 
}: CreditUtilizationChartProps) {
  const chartData = transformCreditUtilizationData(data);
  
  if (!data.length) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Credit Utilization
          </CardTitle>
          <CardDescription>No credit account data available for the selected period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            No credit accounts to display
          </div>
        </CardContent>
      </Card>
    );
  }

  // Check for high utilization accounts
  const highUtilizationAccounts = data.filter(util => util.utilizationRate >= 70);
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Credit Utilization Analysis
        </CardTitle>
        <CardDescription>
          Monitor your credit card utilization rates and available credit
        </CardDescription>
        
        {/* Risk Level Badges */}
        <div className="flex flex-wrap gap-2 mt-2">
          {data.map((util) => {
            const risk = getRiskLevel(util.utilizationRate);
            
            return (
              <Badge
                key={util.accountName}
                variant={risk.variant}
                className="text-xs"
              >
                {util.accountName}: {risk.level} ({util.utilizationRate.toFixed(1)}%)
              </Badge>
            );
          })}
        </div>
      </CardHeader>
      
      <CardContent>
        {/* High Utilization Alert */}
        {showAlerts && highUtilizationAccounts.length > 0 && (
          <Alert className="mb-4 border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>High Utilization Warning:</strong> {highUtilizationAccounts.length} account(s) 
              have utilization above 70%. Consider paying down balances to improve credit score.
            </AlertDescription>
          </Alert>
        )}

        <ResponsiveContainer width="100%" height={400}>
          {chartType === 'composed' ? (
            <ComposedChart 
              data={chartData} 
              margin={{ 
                top: 20, 
                right: window.innerWidth < 768 ? 10 : 30, 
                left: window.innerWidth < 768 ? 10 : 20, 
                bottom: window.innerWidth < 768 ? 80 : 5 
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="accountName" 
                stroke="#666"
                fontSize={window.innerWidth < 768 ? 10 : 12}
                angle={-45}
                textAnchor="end"
                height={window.innerWidth < 768 ? 80 : 60}
                interval={0}
              />
              <YAxis 
                yAxisId="currency"
                orientation="left"
                stroke="#666"
                fontSize={window.innerWidth < 768 ? 10 : 12}
                tickFormatter={formatCurrency}
                width={window.innerWidth < 768 ? 60 : 80}
              />
              <YAxis 
                yAxisId="percentage"
                orientation="right"
                stroke="#666"
                fontSize={window.innerWidth < 768 ? 10 : 12}
                tickFormatter={formatPercentage}
                domain={[0, 100]}
                width={window.innerWidth < 768 ? 40 : 60}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ 
                  fontSize: window.innerWidth < 768 ? '12px' : '14px',
                  paddingTop: '10px'
                }}
              />
              
              {/* Reference line at 30% utilization (recommended max) */}
              <ReferenceLine 
                yAxisId="percentage" 
                y={30} 
                stroke="#22c55e" 
                strokeDasharray="5 5"
                label={{ value: "Recommended Max (30%)", position: "top" }}
              />
              
              {/* Reference line at 70% utilization (warning threshold) */}
              <ReferenceLine 
                yAxisId="percentage" 
                y={70} 
                stroke="#f97316" 
                strokeDasharray="5 5"
                label={{ value: "Warning (70%)", position: "top" }}
              />
              
              <Bar 
                yAxisId="currency"
                dataKey="currentBalance" 
                fill="#ef4444" 
                name="Current Balance"
                opacity={0.8}
              />
              <Bar 
                yAxisId="currency"
                dataKey="availableCredit" 
                fill="#22c55e" 
                name="Available Credit"
                opacity={0.8}
              />
              <Line 
                yAxisId="percentage"
                type="monotone" 
                dataKey="utilizationRate" 
                stroke="#8884d8" 
                strokeWidth={3}
                dot={{ fill: '#8884d8', strokeWidth: 2, r: 6 }}
                name="Utilization Rate (%)"
              />
            </ComposedChart>
          ) : (
            <BarChart 
              data={chartData} 
              margin={{ 
                top: 20, 
                right: window.innerWidth < 768 ? 10 : 30, 
                left: window.innerWidth < 768 ? 10 : 20, 
                bottom: window.innerWidth < 768 ? 80 : 5 
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="accountName" 
                stroke="#666"
                fontSize={window.innerWidth < 768 ? 10 : 12}
                angle={-45}
                textAnchor="end"
                height={window.innerWidth < 768 ? 80 : 60}
                interval={0}
              />
              <YAxis 
                stroke="#666"
                fontSize={window.innerWidth < 768 ? 10 : 12}
                tickFormatter={formatPercentage}
                domain={[0, 100]}
                width={window.innerWidth < 768 ? 60 : 80}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ 
                  fontSize: window.innerWidth < 768 ? '12px' : '14px',
                  paddingTop: '10px'
                }}
              />
              
              <Bar 
                dataKey="utilizationRate" 
                name="Utilization Rate (%)"
                fill="#8884d8"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
        
        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Total Credit Limit</p>
            <p className="text-lg font-semibold">
              {formatCurrency(data.reduce((sum, util) => sum + util.creditLimit, 0))}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Total Balance</p>
            <p className="text-lg font-semibold">
              {formatCurrency(data.reduce((sum, util) => sum + util.currentBalance, 0))}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Overall Utilization</p>
            <p className="text-lg font-semibold">
              {formatPercentage(
                (data.reduce((sum, util) => sum + util.currentBalance, 0) / 
                 data.reduce((sum, util) => sum + util.creditLimit, 0)) * 100
              )}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Simplified version for smaller displays
export function SimpleCreditUtilizationChart({ 
  data, 
  className = '' 
}: Omit<CreditUtilizationChartProps, 'showAlerts' | 'chartType'>) {
  return (
    <CreditUtilizationChart 
      data={data} 
      className={className}
      showAlerts={false}
      chartType="bar"
    />
  );
}

export default CreditUtilizationChart;
