"use client";

import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils/analytics-utils";
import type { DashboardData } from "@/lib/services/dashboard";
import { 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  Wallet, 
  PiggyBank, 
  AlertTriangle,
  ArrowUpDown,
  Activity,
  Plus,
  Receipt,
  RefreshCw
} from "lucide-react";
import { useMemo } from "react";
import { useRouter } from 'next/navigation';

interface EnhancedDashboardProps {
  dashboardData?: DashboardData;
  loading?: boolean;
  className?: string;
}

export function EnhancedDashboard({ 
  dashboardData, 
  loading = false, 
  className 
}: EnhancedDashboardProps) {
  const router = useRouter();
  
  // Transform account data for display
  const accountCards = useMemo(() => {
    if (!dashboardData?.accountSummary?.accounts) return [];
    
    return dashboardData.accountSummary.accounts.map((account) => ({
      title: account.name,
      description: `${account.type} • ${formatCurrency(account.balance)}`,
      link: `/accounts/${account.id}` // You can adjust this route as needed
    }));
  }, [dashboardData?.accountSummary?.accounts]);

  // Quick actions configuration
  const quickActions = [
    {
      id: 'add-income',
      icon: <TrendingUp className="h-4 w-4" />,
      label: 'Add Income',
      variant: 'default' as const,
      action: () => router.push('/transactions?action=create&type=income'),
    },
    {
      id: 'add-expense',
      icon: <TrendingDown className="h-4 w-4" />,
      label: 'Add Expense',
      variant: 'destructive' as const,
      action: () => router.push('/transactions?action=create&type=expense'),
    },
    {
      id: 'transfer',
      icon: <RefreshCw className="h-4 w-4" />,
      label: 'Transfer',
      variant: 'outline' as const,
      action: () => router.push('/transactions?action=create&type=transfer'),
    },
    {
      id: 'manage-accounts',
      icon: <Wallet className="h-4 w-4" />,
      label: 'Accounts',
      variant: 'outline' as const,
      action: () => router.push('/accounts'),
    },
    {
      id: 'view-transactions',
      icon: <Receipt className="h-4 w-4" />,
      label: 'Transactions',
      variant: 'outline' as const,
      action: () => router.push('/transactions'),
    },
    {
      id: 'analytics',
      icon: <Activity className="h-4 w-4" />,
      label: 'Analytics',
      variant: 'outline' as const,
      action: () => router.push('/analytics'),
    },
  ];

  if (loading) {
    return (
      <div className={className}>
        <div className="space-y-6">
          <Skeleton className="h-6 w-64" />
          <BentoGrid className="mx-0 max-w-none md:auto-rows-[12rem]">
            {Array.from({ length: 6 }).map((_, i) => (
              <BentoGridItem
                key={i}
                className="md:col-span-1"
                header={<Skeleton className="h-16 w-full" />}
                title={<Skeleton className="h-4 w-24" />}
                description={<Skeleton className="h-3 w-32" />}
              />
            ))}
          </BentoGrid>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Header Section - Compact */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Financial Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Your financial overview with enhanced insights
          </p>
        </div>

        {/* Quick Actions - Top Priority */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
                <CardDescription>
                  Manage your finances instantly
                </CardDescription>
              </div>
              {dashboardData?.alerts && dashboardData.alerts.length > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {dashboardData.alerts.length} Alert{dashboardData.alerts.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {quickActions.map((action) => (
                <Button
                  key={action.id}
                  size="sm"
                  variant={action.variant}
                  className="flex-col h-auto py-3 px-3 gap-2"
                  onClick={action.action}
                >
                  {action.icon}
                  <span className="text-xs">{action.label}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Bento Grid Layout */}
        <BentoGrid className="mx-0 max-w-none md:auto-rows-[12rem]">
          {/* Financial Health Score - Compact Card */}
          <BentoGridItem
            className="md:col-span-2"
            header={
              <div className="h-20 flex items-center justify-between bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Activity className="h-8 w-8 text-blue-600" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                        {dashboardData?.financialHealthScore?.score || 0}
                      </span>
                      <span className="text-sm text-muted-foreground">/ 100</span>
                      {dashboardData?.financialHealthScore?.trend && (
                        <div className="flex items-center gap-1">
                          {dashboardData.financialHealthScore.trend === 'up' ? (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          ) : dashboardData.financialHealthScore.trend === 'down' ? (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                          ) : (
                            <ArrowUpDown className="h-4 w-4 text-yellow-500" />
                          )}
                        </div>
                      )}
                    </div>
                    <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Financial Health</span>
                  </div>
                </div>
              </div>
            }
            title="Smart Analysis"
            description="Your financial health is tracked and analyzed automatically"
            icon={<Activity className="h-4 w-4 text-neutral-500" />}
          />

          {/* Total Balance */}
          <BentoGridItem
            className="md:col-span-1"
            header={
              <div className="flex items-center justify-center h-16 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg">
                <Wallet className="h-6 w-6 text-blue-600" />
              </div>
            }
            title={
              <div className="space-y-1">
                <div className="text-sm font-medium text-muted-foreground">Total Balance</div>
                <div className="text-lg font-bold">{formatCurrency(dashboardData?.accountSummary?.totalBalance || 0)}</div>
              </div>
            }
            description="All accounts combined"
          />

          {/* Credit Card Balance */}
          <BentoGridItem
            className="md:col-span-1"
            header={
              <div className="flex items-center justify-center h-16 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-lg">
                <CreditCard className="h-6 w-6 text-red-600" />
              </div>
            }
            title={
              <div className="space-y-1">
                <div className="text-sm font-medium text-muted-foreground">Credit Debt</div>
                <div className="text-lg font-bold text-red-600">{formatCurrency(Math.abs(dashboardData?.accountSummary?.creditCardBalance || 0))}</div>
              </div>
            }
            description="Outstanding balance"
          />

          {/* Savings Balance */}
          <BentoGridItem
            className="md:col-span-1"
            header={
              <div className="flex items-center justify-center h-16 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg">
                <PiggyBank className="h-6 w-6 text-green-600" />
              </div>
            }
            title={
              <div className="space-y-1">
                <div className="text-sm font-medium text-muted-foreground">Savings</div>
                <div className="text-lg font-bold text-green-600">{formatCurrency(dashboardData?.accountSummary?.savingsBalance || 0)}</div>
              </div>
            }
            description="Emergency fund & goals"
          />

          {/* Alerts Section */}
          <BentoGridItem
            className="md:col-span-1"
            header={
              <div className="flex items-center justify-center h-16 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
            }
            title={
              <div className="space-y-1">
                <div className="text-sm font-medium text-muted-foreground">Active Alerts</div>
                <div className="text-lg font-bold">{dashboardData?.alerts?.length || 0}</div>
              </div>
            }
            description="Notifications pending"
          />
        </BentoGrid>

        {/* Account Cards with Hover Effects - More Compact */}
        {accountCards.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Your Accounts</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {accountCards.map((account, index) => (
                <Card key={index} className="group hover:shadow-lg transition-all duration-200 cursor-pointer">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{account.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-bold">{account.description}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Recent Transactions - Compact List */}
        {dashboardData?.recentTransactions && dashboardData.recentTransactions.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Recent Activity</h2>
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {dashboardData.recentTransactions.slice(0, 5).map((transaction) => (
                    <div key={transaction.id} className="p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="font-medium">{transaction.description}</div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="secondary" className="text-xs">{transaction.categoryName}</Badge>
                            <span>{transaction.accountName}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-semibold ${transaction.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {transaction.amount < 0 ? '-' : '+'}{formatCurrency(Math.abs(transaction.amount))}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(transaction.transactionDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
