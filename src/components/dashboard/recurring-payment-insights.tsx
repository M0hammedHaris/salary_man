'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  DollarSign,
  Repeat
} from 'lucide-react';
import { displayCurrency } from '@/lib/utils/currency';
import Link from 'next/link';

interface RecurringPaymentInsightsData {
  monthlyTotal: number;
  quarterlyTotal: number;
  yearlyTotal: number;
  activePayments: number;
  upcomingPayments: number;
  missedPayments: number;
  budgetImpact: {
    totalBudget: number;
    recurringAllocation: number;
    utilizationPercentage: number;
  };
  trends: {
    monthlyChange: number;
    monthlyChangePercentage: number;
    direction: 'up' | 'down' | 'stable';
  };
  topCategories: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
}

interface RecurringPaymentInsightsProps {
  userId: string;
  className?: string;
}

export function RecurringPaymentInsights({ userId, className }: RecurringPaymentInsightsProps) {
  const [data, setData] = useState<RecurringPaymentInsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRecurringPaymentInsights() {
      try {
        setLoading(true);
        const response = await fetch('/api/dashboard/recurring-insights');
        if (!response.ok) {
          throw new Error('Failed to fetch recurring payment insights');
        }
        const insights = await response.json();
        setData(insights);
      } catch (err) {
        console.error('Error fetching recurring payment insights:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }

    fetchRecurringPaymentInsights();
  }, [userId]);

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <div className="flex items-center space-x-2">
            <Repeat className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Recurring Payments</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-2 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <div className="flex items-center space-x-2">
            <Repeat className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Recurring Payments</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Unable to load recurring payment insights
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Repeat className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Recurring Payments</CardTitle>
          </div>
          <Link href="/recurring-payments">
            <Button variant="ghost" size="sm">View All</Button>
          </Link>
        </div>
        <CardDescription>
          Monthly spending on subscriptions and recurring bills
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Monthly Total with Trend */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold">
              {displayCurrency(data.monthlyTotal)}
            </p>
            <p className="text-xs text-muted-foreground">Monthly Total</p>
          </div>
          <div className="flex items-center space-x-1">
            {data.trends.direction === 'up' && (
              <TrendingUp className="h-4 w-4 text-red-500" />
            )}
            {data.trends.direction === 'down' && (
              <TrendingDown className="h-4 w-4 text-green-500" />
            )}
            <span className={`text-xs ${
              data.trends.direction === 'up' ? 'text-red-500' : 
              data.trends.direction === 'down' ? 'text-green-500' : 
              'text-muted-foreground'
            }`}>
              {(data.trends.monthlyChangePercentage || 0) > 0 ? '+' : ''}
              {(data.trends.monthlyChangePercentage || 0).toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Budget Impact */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Budget Impact</span>
            <span className="font-medium">
              {(data.budgetImpact?.utilizationPercentage || 0).toFixed(1)}%
            </span>
          </div>
          <Progress 
            value={data.budgetImpact?.utilizationPercentage || 0} 
            className="h-2"
          />
          <p className="text-xs text-muted-foreground">
            {displayCurrency(data.budgetImpact?.recurringAllocation || 0)} of {displayCurrency(data.budgetImpact?.totalBudget || 0)}
          </p>
        </div>

        {/* Payment Status */}
        <div className="grid grid-cols-3 gap-4 pt-2">
          <div className="text-center">
            <p className="text-lg font-semibold text-green-600">{data.activePayments}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-blue-600">{data.upcomingPayments}</p>
            <p className="text-xs text-muted-foreground">Upcoming</p>
          </div>
          {data.missedPayments > 0 && (
            <div className="text-center">
              <p className="text-lg font-semibold text-red-600">{data.missedPayments}</p>
              <p className="text-xs text-muted-foreground">Missed</p>
            </div>
          )}
        </div>

        {/* Top Categories */}
        {data.topCategories.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Top Categories</p>
            <div className="space-y-1">
              {data.topCategories.slice(0, 3).map((category) => (
                <div key={category.category} className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{category.category}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">
                      {displayCurrency(category.amount)}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {category.percentage.toFixed(0)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex space-x-2 pt-2">
          <Link href="/recurring-payments/detect" className="flex-1">
            <Button variant="outline" size="sm" className="w-full text-xs">
              <DollarSign className="h-3 w-3 mr-1" />
              Detect Patterns
            </Button>
          </Link>
          {data.missedPayments > 0 && (
            <Link href="/recurring-payments?tab=missed" className="flex-1">
              <Button variant="outline" size="sm" className="w-full text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Review Missed
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
