"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Plus
} from "lucide-react";

interface CompactDashboardProps {
  dashboardData?: DashboardData;
  loading?: boolean;
  className?: string;
}

export function CompactDashboard({ 
  dashboardData, 
  loading = false, 
  className 
}: CompactDashboardProps) {
  
  if (loading) {
    return (
      <div className={className}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-16 bg-muted rounded mb-2"></div>
                <div className="h-4 bg-muted rounded w-3/4 mb-1"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="space-y-4">
        {/* Compact Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Financial Health */}
          <Card className="hover:shadow-lg transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Activity className="h-5 w-5 text-blue-600" />
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
              <div className="space-y-1">
                <div className="text-sm font-medium text-muted-foreground">Financial Health</div>
                <div className="text-2xl font-bold text-blue-600">
                  {dashboardData?.financialHealthScore?.score || 0}<span className="text-sm text-muted-foreground">/100</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Balance */}
          <Card className="hover:shadow-lg transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Wallet className="h-5 w-5 text-green-600" />
              </div>
              <div className="space-y-1">
                <div className="text-sm font-medium text-muted-foreground">Total Balance</div>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(dashboardData?.accountSummary?.totalBalance || 0)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Credit Debt */}
          <Card className="hover:shadow-lg transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <CreditCard className="h-5 w-5 text-red-600" />
              </div>
              <div className="space-y-1">
                <div className="text-sm font-medium text-muted-foreground">Credit Debt</div>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(Math.abs(dashboardData?.accountSummary?.creditCardBalance || 0))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Savings */}
          <Card className="hover:shadow-lg transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <PiggyBank className="h-5 w-5 text-purple-600" />
              </div>
              <div className="space-y-1">
                <div className="text-sm font-medium text-muted-foreground">Savings</div>
                <div className="text-2xl font-bold text-purple-600">
                  {formatCurrency(dashboardData?.accountSummary?.savingsBalance || 0)}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        {dashboardData?.recentTransactions && dashboardData.recentTransactions.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Recent Activity</CardTitle>
                <Button size="sm" variant="ghost">View All</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {dashboardData.recentTransactions.slice(0, 3).map((transaction) => (
                  <div key={transaction.id} className="px-6 py-3 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="font-medium text-sm">{transaction.description}</div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="secondary" className="text-xs px-2 py-0">{transaction.categoryName}</Badge>
                          <span>{transaction.accountName}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-semibold text-sm ${transaction.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
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
        )}

        {/* Quick Actions */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="default" className="gap-1">
                  <Plus className="h-3 w-3" />
                  Add Transaction
                </Button>
                <Button size="sm" variant="outline">Transfer</Button>
                <Button size="sm" variant="outline">Pay Bills</Button>
              </div>
              {dashboardData?.alerts && dashboardData.alerts.length > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {dashboardData.alerts.length} Alert{dashboardData.alerts.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
