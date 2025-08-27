'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  Minus, 
  Calendar,
  DollarSign,
  CreditCard,
  Target,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import type { AnalyticsComparisons } from '@/lib/types/analytics';

interface ComparisonWidgetsProps {
  data: AnalyticsComparisons;
  className?: string;
  showAlerts?: boolean;
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

// Custom formatter for compact currency
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

// Format percentage with sign
const formatPercentage = (value: number): string => {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
};

// Get trend icon and color
const getTrendIndicator = (value: number, reverse = false) => {
  const isPositive = reverse ? value < 0 : value > 0;
  
  if (Math.abs(value) < 0.1) {
    return {
      icon: <Minus className="h-4 w-4 text-gray-500" />,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
    };
  }
  
  if (isPositive) {
    return {
      icon: <ArrowUpRight className="h-4 w-4 text-green-500" />,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    };
  }
  
  return {
    icon: <ArrowDownRight className="h-4 w-4 text-red-500" />,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  };
};

// Individual comparison card component
interface ComparisonCardProps {
  title: string;
  current: number;
  previous: number;
  change: number;
  changePercent: number;
  icon: React.ReactNode;
  reverse?: boolean;
  formatter?: (value: number) => string;
}

const ComparisonCard = ({ 
  title, 
  current, 
  previous, 
  change, 
  changePercent, 
  icon,
  reverse = false,
  formatter = formatCompactCurrency 
}: ComparisonCardProps) => {
  const trend = getTrendIndicator(changePercent, reverse);
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <span className="font-medium text-sm">{title}</span>
          </div>
          {trend.icon}
        </div>
        
        <div className="mt-2">
          <div className="text-2xl font-bold">{formatter(current)}</div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">
              vs {formatter(previous)}
            </span>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${trend.bgColor}`}>
              <span className={`font-medium ${trend.color}`}>
                {formatPercentage(changePercent)}
              </span>
            </div>
          </div>
          <div className={`text-xs mt-1 ${trend.color}`}>
            {change > 0 ? '+' : ''}{formatter(change)} from last period
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export function ComparisonWidgets({ 
  data, 
  className = '',
  showAlerts = true 
}: ComparisonWidgetsProps) {
  if (!data) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Financial Comparisons
          </CardTitle>
          <CardDescription>No comparison data available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-32 flex items-center justify-center text-muted-foreground">
            No data to display
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate significant changes for alerts
  const significantThreshold = 20; // 20% change
  const significantChanges = [
    { name: 'Income', change: data.incomeChange.percentChange, type: 'income' },
    { name: 'Expenses', change: data.expenseChange.percentChange, type: 'expense' },
    { name: 'Savings', change: data.savingsChange.percentChange, type: 'savings' },
    { name: 'Net Worth', change: data.netWorthChange.percentChange, type: 'networth' },
  ].filter(item => Math.abs(item.change) >= significantThreshold);

  return (
    <div className={className}>
      {/* Alerts for significant changes */}
      {showAlerts && significantChanges.length > 0 && (
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-orange-800 mb-2">Significant Changes Detected</h4>
                <div className="space-y-1 text-sm text-orange-700">
                  {significantChanges.map((change, index) => (
                    <p key={index}>
                      <strong>{change.name}</strong> changed by {formatPercentage(change.change)} from last period
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="income-expense">Income & Expenses</TabsTrigger>
          <TabsTrigger value="assets">Assets & Savings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <ComparisonCard
              title="Total Income"
              current={data.incomeChange.current}
              previous={data.incomeChange.previous}
              change={data.incomeChange.change}
              changePercent={data.incomeChange.percentChange}
              icon={<DollarSign className="h-4 w-4 text-green-600" />}
            />
            
            <ComparisonCard
              title="Total Expenses"
              current={data.expenseChange.current}
              previous={data.expenseChange.previous}
              change={data.expenseChange.change}
              changePercent={data.expenseChange.percentChange}
              icon={<CreditCard className="h-4 w-4 text-red-600" />}
              reverse={true}
            />
            
            <ComparisonCard
              title="Net Savings"
              current={data.savingsChange.current}
              previous={data.savingsChange.previous}
              change={data.savingsChange.change}
              changePercent={data.savingsChange.percentChange}
              icon={<Target className="h-4 w-4 text-blue-600" />}
            />
            
            <ComparisonCard
              title="Net Worth"
              current={data.netWorthChange.current}
              previous={data.netWorthChange.previous}
              change={data.netWorthChange.change}
              changePercent={data.netWorthChange.percentChange}
              icon={<TrendingUp className="h-4 w-4 text-purple-600" />}
            />
          </div>
        </TabsContent>

        <TabsContent value="income-expense" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Income Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  Income Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Current Period</span>
                    <span className="font-semibold">{formatCurrency(data.incomeChange.current)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Previous Period</span>
                    <span className="font-semibold">{formatCurrency(data.incomeChange.previous)}</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Change</span>
                      <div className="text-right">
                        <div className={`font-semibold ${data.incomeChange.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {data.incomeChange.change > 0 ? '+' : ''}{formatCurrency(data.incomeChange.change)}
                        </div>
                        <div className={`text-xs ${data.incomeChange.percentChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPercentage(data.incomeChange.percentChange)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Expense Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-red-600" />
                  Expense Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Current Period</span>
                    <span className="font-semibold">{formatCurrency(data.expenseChange.current)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Previous Period</span>
                    <span className="font-semibold">{formatCurrency(data.expenseChange.previous)}</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Change</span>
                      <div className="text-right">
                        <div className={`font-semibold ${data.expenseChange.change <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {data.expenseChange.change > 0 ? '+' : ''}{formatCurrency(data.expenseChange.change)}
                        </div>
                        <div className={`text-xs ${data.expenseChange.percentChange <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPercentage(data.expenseChange.percentChange)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="assets" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Savings Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  Savings Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Current Savings</span>
                    <span className="font-semibold">{formatCurrency(data.savingsChange.current)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Previous Savings</span>
                    <span className="font-semibold">{formatCurrency(data.savingsChange.previous)}</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Change</span>
                      <div className="text-right">
                        <div className={`font-semibold ${data.savingsChange.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {data.savingsChange.change > 0 ? '+' : ''}{formatCurrency(data.savingsChange.change)}
                        </div>
                        <div className={`text-xs ${data.savingsChange.percentChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPercentage(data.savingsChange.percentChange)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Net Worth Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                  Net Worth Growth
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Current Net Worth</span>
                    <span className="font-semibold">{formatCurrency(data.netWorthChange.current)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Previous Net Worth</span>
                    <span className="font-semibold">{formatCurrency(data.netWorthChange.previous)}</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Growth</span>
                      <div className="text-right">
                        <div className={`font-semibold ${data.netWorthChange.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {data.netWorthChange.change > 0 ? '+' : ''}{formatCurrency(data.netWorthChange.change)}
                        </div>
                        <div className={`text-xs ${data.netWorthChange.percentChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPercentage(data.netWorthChange.percentChange)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card className="mt-6">
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              Comparison Period: Last {data.incomeChange.current ? '30' : '0'} days
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Calendar className="h-3 w-3 mr-1" />
                Change Period
              </Button>
              <Button variant="outline" size="sm">
                Export Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ComparisonWidgets;
