"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { DateRangeSelector, useDateRange } from './date-range-selector';
import { CashFlowChart } from './cash-flow-chart';
import { SpendingBreakdownChart } from './spending-breakdown-chart';
import { AccountTrendsChart } from './account-trends-chart';
import { CreditUtilizationChart } from './credit-utilization-chart';
import { NetWorthTracker } from './net-worth-tracker';
import { ComparisonWidgets } from './comparison-widgets';
import { formatCurrency } from '@/lib/utils/analytics-utils';
import type { AnalyticsDashboardData, PeriodComparison } from '@/lib/types/analytics';

interface AnalyticsDashboardProps {
  className?: string;
}

export function AnalyticsDashboard({ className }: AnalyticsDashboardProps) {
  const [dashboardData, setDashboardData] = useState<AnalyticsDashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { dateRange, setDateRange } = useDateRange();

  // Fetch data on component mount and when date range changes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch overview data
        const overviewParams = new URLSearchParams({
          startDate: dateRange.startDate.toISOString(),
          endDate: dateRange.endDate.toISOString(),
        });

        const overviewResponse = await fetch(`/api/analytics/overview?${overviewParams}`);
        if (!overviewResponse.ok) {
          throw new Error('Failed to fetch overview data');
        }
        const { overview } = await overviewResponse.json();

        // Fetch other data in parallel
        const [cashFlowRes, spendingRes, accountTrendsRes, creditUtilRes, netWorthRes, comparisonsRes] = await Promise.all([
          fetch(`/api/analytics/cash-flow?${overviewParams}`),
          fetch(`/api/analytics/spending-breakdown?${overviewParams}`),
          fetch(`/api/analytics/account-trends?${overviewParams}`),
          fetch(`/api/analytics/credit-utilization?${overviewParams}`),
          fetch(`/api/analytics/net-worth?${overviewParams}`),
          fetch(`/api/analytics/comparisons?${overviewParams}&previousStartDate=${new Date(dateRange.startDate.getTime() - (dateRange.endDate.getTime() - dateRange.startDate.getTime())).toISOString()}&previousEndDate=${new Date(dateRange.startDate.getTime() - 1).toISOString()}`),
        ]);

        // Parse responses with error handling for individual endpoints
        const parseResponseSafely = async (response: Response, fallback: Record<string, unknown>) => {
          if (!response.ok) {
            console.warn(`Analytics API endpoint failed: ${response.url}`);
            return fallback;
          }
          try {
            return await response.json();
          } catch (error) {
            console.warn(`Failed to parse response from ${response.url}:`, error);
            return fallback;
          }
        };

        const [
          { cashFlow },
          { spendingBreakdown },
          { accountTrends },
          { creditUtilization },
          { netWorthHistory },
          { comparisons }
        ] = await Promise.all([
          parseResponseSafely(cashFlowRes, { cashFlow: [] }),
          parseResponseSafely(spendingRes, { spendingBreakdown: [] }),
          parseResponseSafely(accountTrendsRes, { accountTrends: [] }),
          parseResponseSafely(creditUtilRes, { creditUtilization: [] }),
          parseResponseSafely(netWorthRes, { netWorthHistory: [] }),
          parseResponseSafely(comparisonsRes, { comparisons: [] }),
        ]);

        setDashboardData({
          overview,
          cashFlow,
          spendingBreakdown,
          accountTrends,
          creditUtilization,
          netWorthHistory,
          comparisons,
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch analytics data';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRange]);

  const getTrendIcon = (trend: 'up' | 'down' | 'stable', value: number) => {
    if (trend === 'up') {
      return <TrendingUp className={`h-4 w-4 ${value > 0 ? 'text-green-500' : 'text-red-500'}`} />;
    } else if (trend === 'down') {
      return <TrendingDown className={`h-4 w-4 ${value < 0 ? 'text-red-500' : 'text-green-500'}`} />;
    }
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  // Transform comparisons data for ComparisonWidgets
  const transformComparisonsData = (comparisons: PeriodComparison[]) => {
    const findComparison = (metric: string) => {
      const comp = comparisons.find(c => c.metric === metric);
      return comp ? {
        current: comp.currentPeriod,
        previous: comp.previousPeriod,
        change: comp.change,
        percentChange: comp.changePercentage,
      } : { current: 0, previous: 0, change: 0, percentChange: 0 };
    };

    return {
      incomeChange: findComparison('income'),
      expenseChange: findComparison('expenses'),
      savingsChange: findComparison('savings'),
      netWorthChange: findComparison('netWorth'),
    };
  };

  if (error) {
    return (
      <div className={className}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Financial Analytics</h1>
            <p className="text-muted-foreground">
              Comprehensive insights into your financial patterns and trends
            </p>
          </div>
          <DateRangeSelector
            value={dateRange}
            onChange={setDateRange}
            disabled={loading}
          />
        </div>

        {/* Overview Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            // Loading skeletons
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-7 w-[120px] mb-1" />
                  <Skeleton className="h-3 w-[160px]" />
                </CardContent>
              </Card>
            ))
          ) : dashboardData ? (
            // Actual overview cards
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Net Cash Flow</CardTitle>
                  {dashboardData.comparisons?.find(c => c.metric === 'netCashFlow') &&
                    getTrendIcon(
                      dashboardData.comparisons.find(c => c.metric === 'netCashFlow')!.trend,
                      dashboardData.comparisons.find(c => c.metric === 'netCashFlow')!.change
                    )
                  }
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(dashboardData.overview.netCashFlow)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {dashboardData.comparisons?.find(c => c.metric === 'netCashFlow')?.changePercentage.toFixed(1)}% from previous period
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Income</CardTitle>
                  {dashboardData.comparisons?.find(c => c.metric === 'income') &&
                    getTrendIcon(
                      dashboardData.comparisons.find(c => c.metric === 'income')!.trend,
                      dashboardData.comparisons.find(c => c.metric === 'income')!.change
                    )
                  }
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(dashboardData.overview.totalIncome)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {dashboardData.comparisons?.find(c => c.metric === 'income')?.changePercentage.toFixed(1)}% from previous period
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                  {dashboardData.comparisons?.find(c => c.metric === 'expenses') &&
                    getTrendIcon(
                      dashboardData.comparisons.find(c => c.metric === 'expenses')!.trend,
                      -dashboardData.comparisons.find(c => c.metric === 'expenses')!.change // Reverse for expenses
                    )
                  }
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(dashboardData.overview.totalExpenses)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {dashboardData.comparisons?.find(c => c.metric === 'expenses')?.changePercentage.toFixed(1)}% from previous period
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Net Worth</CardTitle>
                  {dashboardData.comparisons?.find(c => c.metric === 'netWorth') &&
                    getTrendIcon(
                      dashboardData.comparisons.find(c => c.metric === 'netWorth')!.trend,
                      dashboardData.comparisons.find(c => c.metric === 'netWorth')!.change
                    )
                  }
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(dashboardData.overview.netWorth)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {dashboardData.comparisons?.find(c => c.metric === 'netWorth')?.changePercentage.toFixed(1)}% from previous period
                  </p>
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>

        {/* Charts Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="justify-start w-full overflow-x-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
            <TabsTrigger value="spending">Spending</TabsTrigger>
            <TabsTrigger value="accounts">Accounts</TabsTrigger>
            <TabsTrigger value="credit">Credit Cards</TabsTrigger>
            <TabsTrigger value="networth">Net Worth</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Transaction Summary</CardTitle>
                  <CardDescription>
                    Transaction activity for the selected period
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  ) : dashboardData ? (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Total Transactions:</span>
                        <span className="font-semibold">{dashboardData.overview.transactionCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Active Accounts:</span>
                        <span className="font-semibold">{dashboardData.overview.accountCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Average Transaction:</span>
                        <span className="font-semibold">
                          {formatCurrency(dashboardData.overview.averageTransactionValue)}
                        </span>
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Assets vs. Liabilities</CardTitle>
                  <CardDescription>
                    Your current financial position
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  ) : dashboardData ? (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Total Assets:</span>
                        <span className="font-semibold text-green-600">
                          {formatCurrency(dashboardData.overview.totalAssets)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Liabilities:</span>
                        <span className="font-semibold text-red-600">
                          {formatCurrency(dashboardData.overview.totalLiabilities)}
                        </span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="font-medium">Net Worth:</span>
                        <span className={`font-bold ${dashboardData.overview.netWorth >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                          {formatCurrency(dashboardData.overview.netWorth)}
                        </span>
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Placeholder content for other tabs */}
          <TabsContent value="cashflow" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Cash Flow Analysis</CardTitle>
                <CardDescription>Income vs expenses over time</CardDescription>
              </CardHeader>
              <CardContent>
                <CashFlowChart
                  data={dashboardData?.cashFlow || []}
                  height={400}
                  showNetFlow={true}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="spending" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Spending by Category</CardTitle>
                  <CardDescription>Pie chart visualization</CardDescription>
                </CardHeader>
                <CardContent>
                  <SpendingBreakdownChart
                    data={dashboardData?.spendingBreakdown || []}
                    height={350}
                    chartType="pie"
                  />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Category Comparison</CardTitle>
                  <CardDescription>Bar chart visualization</CardDescription>
                </CardHeader>
                <CardContent>
                  <SpendingBreakdownChart
                    data={dashboardData?.spendingBreakdown || []}
                    height={350}
                    chartType="bar"
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="accounts">
            <AccountTrendsChart
              data={dashboardData?.accountTrends || []}
              className="mb-6"
            />
          </TabsContent>

          <TabsContent value="credit">
            <CreditUtilizationChart
              data={dashboardData?.creditUtilization || []}
              className="mb-6"
            />
          </TabsContent>

          <TabsContent value="networth" className="space-y-6">
            <NetWorthTracker
              data={dashboardData?.netWorthHistory || []}
              className="mb-6"
            />

            <ComparisonWidgets
              data={dashboardData ? transformComparisonsData(dashboardData.comparisons) : {
                incomeChange: { current: 0, previous: 0, change: 0, percentChange: 0 },
                expenseChange: { current: 0, previous: 0, change: 0, percentChange: 0 },
                savingsChange: { current: 0, previous: 0, change: 0, percentChange: 0 },
                netWorthChange: { current: 0, previous: 0, change: 0, percentChange: 0 },
              }}
              className="mb-6"
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
