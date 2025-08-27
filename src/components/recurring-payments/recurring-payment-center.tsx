"use client";

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUser } from '@clerk/nextjs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  CreditCard,
  DollarSign,
  TrendingUp,
  Calendar,
  Eye,
  EyeOff,
  Settings,
  Plus,
} from 'lucide-react';
import type { RecurringPaymentWithPatterns, CostAnalysis, MissedPaymentAlert } from '../../lib/types/bill-types';

interface RecurringPaymentCenterProps {
  className?: string;
}

export function RecurringPaymentCenter({ className: _className }: RecurringPaymentCenterProps) {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('overview');
  const [showAmounts, setShowAmounts] = useState(true);

  // Fetch recurring payments
  const { data: payments, isLoading, error, refetch } = useQuery<RecurringPaymentWithPatterns[]>({
    queryKey: ['recurring-payments'],
    queryFn: async () => {
      const response = await fetch('/api/recurring-payments');
      if (!response.ok) {
        throw new Error('Failed to fetch recurring payments');
      }
      return response.json();
    },
    enabled: !!user,
  });

  // Fetch cost analysis
  const { data: costAnalysis } = useQuery<CostAnalysis>({
    queryKey: ['recurring-payments-analysis'],
    queryFn: async () => {
      const response = await fetch('/api/recurring-payments/analysis');
      if (!response.ok) {
        throw new Error('Failed to fetch cost analysis');
      }
      return response.json();
    },
    enabled: !!user,
  });

  // Fetch missed payments
  const { data: missedPayments } = useQuery<MissedPaymentAlert[]>({
    queryKey: ['missed-payments'],
    queryFn: async () => {
      const response = await fetch('/api/recurring-payments/missed');
      if (!response.ok) {
        throw new Error('Failed to fetch missed payments');
      }
      return response.json();
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-red-600">Failed to load recurring payments</p>
              <Button onClick={() => refetch()} className="mt-4">
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activePayments = payments?.filter(p => p.isActive) || [];
  const totalMonthlyAmount = activePayments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);

  const formatCurrency = (amount: number) => {
    return showAmounts ? `₹${amount.toLocaleString()}` : '₹****';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recurring Payments</h1>
          <p className="text-muted-foreground mt-1">
            Manage your subscriptions and recurring expenses
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAmounts(!showAmounts)}
          >
            {showAmounts ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Recurring Payment
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Monthly</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalMonthlyAmount)}</div>
            <p className="text-xs text-muted-foreground">
              {activePayments.length} active payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(costAnalysis?.projectedMonthlyCost || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Projected spending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activePayments.filter(p => {
                if (!p.nextDueDate) return false;
                const nextDate = new Date(p.nextDueDate);
                const weekFromNow = new Date();
                weekFromNow.setDate(weekFromNow.getDate() + 7);
                return nextDate <= weekFromNow;
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Next 7 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Missed</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {missedPayments?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="detection">Pattern Detection</TabsTrigger>
          <TabsTrigger value="analysis">Cost Analysis</TabsTrigger>
          <TabsTrigger value="missed">Missed Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Active Recurring Payments */}
          <Card>
            <CardHeader>
              <CardTitle>Active Recurring Payments</CardTitle>
              <CardDescription>
                Your current subscriptions and recurring expenses
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activePayments.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No recurring payments found</p>
                  <Button variant="outline" className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Payment
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {activePayments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                          <CreditCard className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{payment.name}</p>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <span>Every {payment.frequency}</span>
                            <Separator orientation="vertical" className="h-4" />
                            <span>
                              Next: {payment.nextDueDate 
                                ? new Date(payment.nextDueDate).toLocaleDateString()
                                : 'Not scheduled'
                              }
                            </span>
                            {payment.detectedPatterns && payment.detectedPatterns.length > 0 && (
                              <>
                                <Separator orientation="vertical" className="h-4" />
                                <span className={getConfidenceColor(payment.detectedPatterns[0].confidence)}>
                                  {Math.round(payment.detectedPatterns[0].confidence * 100)}% confidence
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(parseFloat(payment.amount))}</p>
                          <Badge className={getStatusColor(payment.status)}>
                            {payment.status}
                          </Badge>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detection" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pattern Detection Results</CardTitle>
              <CardDescription>
                Automatically detected recurring payment patterns from your transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Pattern detection content will be added here */}
              <div className="text-center py-8">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Pattern detection coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cost Analysis</CardTitle>
              <CardDescription>
                Breakdown of your recurring payment costs and trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              {costAnalysis ? (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Monthly Total</p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(costAnalysis.projectedMonthlyCost)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Annual Total</p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(costAnalysis.projectedAnnualCost)}
                      </p>
                    </div>
                  </div>

                  {costAnalysis.categoryBreakdown && Object.keys(costAnalysis.categoryBreakdown).length > 0 && (
                    <div>
                      <h3 className="font-medium mb-3">Spending by Category</h3>
                      <div className="space-y-3">
                        {Object.entries(costAnalysis.categoryBreakdown).map(([category, amount]) => (
                          <div key={category} className="flex items-center justify-between">
                            <span className="text-sm">{category}</span>
                            <span className="text-sm font-medium">{formatCurrency(amount as number)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {costAnalysis.trends && costAnalysis.trends.length > 0 && (
                    <div>
                      <h3 className="font-medium mb-3">Recent Trends</h3>
                      <div className="space-y-2">
                        {costAnalysis.trends.map((trend: string, index: number) => (
                          <div key={index} className="flex items-center space-x-2 text-sm">
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            <span>{trend}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No analysis data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="missed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Missed Payments</CardTitle>
              <CardDescription>
                Payments that may have been missed or require attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              {missedPayments && missedPayments.length > 0 ? (
                <div className="space-y-4">
                  {missedPayments.map((missed, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50"
                    >
                      <div className="flex items-center space-x-4">
                        <AlertCircle className="h-5 w-5 text-red-500" />
                        <div>
                          <p className="font-medium">{missed.description}</p>
                          <p className="text-sm text-red-600">
                            Expected: {new Date(missed.expectedDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-red-600">
                          {formatCurrency(missed.expectedAmount)}
                        </span>
                        <Button size="sm" variant="outline">
                          Mark as Paid
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                  <p className="text-muted-foreground">No missed payments detected</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    All your recurring payments are on track
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
