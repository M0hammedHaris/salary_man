"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Target,
  AlertCircle,
  Info,
} from 'lucide-react';
import type { CostAnalysis } from '../../lib/types/bill-types';

interface CostAnalysisDashboardProps {
  costAnalysis: CostAnalysis;
  budgetLimit?: number;
  className?: string;
}

const COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1',
  '#d084d0', '#ffb347', '#87ceeb', '#dda0dd', '#98fb98'
];

export function CostAnalysisDashboard({
  costAnalysis,
  budgetLimit,
  className,
}: CostAnalysisDashboardProps) {
  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString()}`;
  };

  // Prepare chart data
  const categoryData = costAnalysis.categoryBreakdown
    ? Object.entries(costAnalysis.categoryBreakdown).map(([category, amount]) => ({
        name: category,
        value: amount,
        percentage: ((amount / costAnalysis.projectedMonthlyCost) * 100).toFixed(1),
      }))
    : [];

  const budgetUtilization = budgetLimit 
    ? (costAnalysis.projectedMonthlyCost / budgetLimit) * 100 
    : null;

  const getBudgetStatus = () => {
    if (!budgetUtilization) return null;
    if (budgetUtilization >= 100) return 'over';
    if (budgetUtilization >= 85) return 'warning';
    return 'good';
  };

  const budgetStatus = getBudgetStatus();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(costAnalysis.projectedMonthlyCost)}
            </div>
            <p className="text-xs text-muted-foreground">
              Projected recurring expenses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Annual Cost</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(costAnalysis.projectedAnnualCost)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total yearly commitment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categoryData.length}</div>
            <p className="text-xs text-muted-foreground">
              Active spending categories
            </p>
          </CardContent>
        </Card>

        {budgetLimit && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Budget Usage</CardTitle>
              {budgetStatus === 'over' ? (
                <AlertCircle className="h-4 w-4 text-red-500" />
              ) : budgetStatus === 'warning' ? (
                <TrendingUp className="h-4 w-4 text-yellow-500" />
              ) : (
                <TrendingUp className="h-4 w-4 text-green-500" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {budgetUtilization!.toFixed(1)}%
              </div>
              <Progress
                value={Math.min(budgetUtilization!, 100)}
                className={`mt-2 ${
                  budgetStatus === 'over'
                    ? '[&>div]:bg-red-500'
                    : budgetStatus === 'warning'
                    ? '[&>div]:bg-yellow-500'
                    : '[&>div]:bg-green-500'
                }`}
              />
              <p className="text-xs text-muted-foreground mt-1">
                of {formatCurrency(budgetLimit)} budget
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Category Details */}
      {categoryData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Category Breakdown</CardTitle>
            <CardDescription>
              Detailed breakdown of spending across all categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categoryData
                .sort((a, b) => b.value - a.value)
                .map((category, index) => (
                  <div key={category.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <div>
                          <p className="font-medium">{category.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {category.percentage}% of total
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(category.value)}</p>
                        <p className="text-sm text-muted-foreground">per month</p>
                      </div>
                    </div>
                    <Progress
                      value={parseFloat(category.percentage)}
                      className="h-2"
                    />
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights and Recommendations */}
      {costAnalysis.trends && costAnalysis.trends.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Insights & Trends</span>
            </CardTitle>
            <CardDescription>
              AI-generated insights based on your recurring payment patterns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {costAnalysis.trends.map((trend, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-muted/50 rounded-lg">
                  <Info className="h-4 w-4 text-blue-500 mt-0.5" />
                  <p className="text-sm">{trend}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Budget Alert */}
      {budgetStatus === 'over' && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              <span>Budget Exceeded</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">
              Your recurring payments exceed your budget by{' '}
              <strong>{formatCurrency(costAnalysis.projectedMonthlyCost - budgetLimit!)}</strong>.
              Consider reviewing and optimizing your subscriptions.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Cost Optimization Tips</CardTitle>
          <CardDescription>
            Ways to reduce your recurring payment expenses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">Review Subscriptions</h3>
              <p className="text-sm text-muted-foreground">
                Cancel unused services and downgrade overpriced plans
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">Bundle Services</h3>
              <p className="text-sm text-muted-foreground">
                Look for bundle deals that combine multiple services
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">Annual Plans</h3>
              <p className="text-sm text-muted-foreground">
                Switch to yearly billing for significant savings
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">Track Usage</h3>
              <p className="text-sm text-muted-foreground">
                Monitor actual usage vs. plan limits to optimize tiers
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
