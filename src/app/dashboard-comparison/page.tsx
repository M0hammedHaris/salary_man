"use client";

import { useState, useEffect } from "react";
import { EnhancedDashboard } from "@/components/dashboard/enhanced-dashboard";
import { CompactDashboard } from "@/components/dashboard/compact-dashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardData } from "@/lib/services/dashboard";

// Mock data for demonstration
const mockDashboardData: DashboardData = {
  financialHealthScore: {
    score: 78,
    trend: 'up' as const,
    explanation: "Your financial health is good! You have positive account balances and well-managed credit utilization."
  },
  accountSummary: {
    totalBalance: 125000,
    checkingBalance: 45000,
    savingsBalance: 80000,
    creditCardBalance: -5000,
    accounts: [
      {
        id: "acc1",
        name: "HDFC Savings",
        type: "Savings",
        balance: 80000,
        status: 'positive' as const
      },
      {
        id: "acc2", 
        name: "ICICI Checking",
        type: "Checking",
        balance: 45000,
        status: 'positive' as const
      },
      {
        id: "acc3",
        name: "SBI Credit Card",
        type: "Credit Card",
        balance: -5000,
        status: 'negative' as const
      },
      {
        id: "acc4",
        name: "Axis Bank FD",
        type: "Fixed Deposit", 
        balance: 200000,
        status: 'positive' as const
      }
    ]
  },
  creditCardUtilization: [
    {
      accountId: "acc3",
      accountName: "SBI Credit Card",
      utilization: 0.25,
      balance: 5000,
      creditLimit: 20000,
      status: 'good' as const
    }
  ],
  recentTransactions: [
    {
      id: "txn1",
      description: "Grocery Shopping - BigBasket",
      amount: -2500,
      categoryName: "Food & Dining",
      categoryColor: "#22c55e",
      transactionDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      accountName: "HDFC Savings"
    },
    {
      id: "txn2", 
      description: "Salary Credit",
      amount: 85000,
      categoryName: "Income",
      categoryColor: "#3b82f6",
      transactionDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      accountName: "HDFC Savings"
    },
    {
      id: "txn3",
      description: "Electricity Bill Payment",
      amount: -1800,
      categoryName: "Utilities",
      categoryColor: "#f59e0b",
      transactionDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      accountName: "ICICI Checking"
    },
    {
      id: "txn4",
      description: "Netflix Subscription",
      amount: -799,
      categoryName: "Entertainment",
      categoryColor: "#ec4899",
      transactionDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      accountName: "SBI Credit Card"
    },
    {
      id: "txn5",
      description: "Fuel - Shell",
      amount: -3200,
      categoryName: "Transportation",
      categoryColor: "#8b5cf6",
      transactionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      accountName: "HDFC Savings"
    }
  ],
  alerts: [
    {
      id: "alert1",
      type: 'warning' as const,
      message: "Your SBI Credit Card utilization is at 25%. Consider paying down the balance.",
      priority: 'medium' as const,
      actionRequired: true
    },
    {
      id: "alert2",
      type: 'info' as const,
      message: "You've spent ₹8,299 this month across all categories.",
      priority: 'low' as const,
      actionRequired: false
    }
  ]
};

export default function DashboardComparison() {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | undefined>(undefined);

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setDashboardData(mockDashboardData);
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="container mx-auto py-8">
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard UI Comparison</h1>
          <p className="text-muted-foreground text-lg">
            Compare different dashboard layouts for your financial app
          </p>
        </div>

        <Tabs defaultValue="compact" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="compact">Compact Dashboard</TabsTrigger>
            <TabsTrigger value="enhanced">Enhanced Dashboard</TabsTrigger>
          </TabsList>
          
          <TabsContent value="compact" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Compact Dashboard</CardTitle>
                <CardDescription>
                  Clean, minimal design perfect for quick financial overview. Optimized for space efficiency and fast scanning.
                </CardDescription>
              </CardHeader>
            </Card>
            
            <CompactDashboard 
              dashboardData={dashboardData}
              loading={loading}
              className="space-y-4"
            />
          </TabsContent>
          
          <TabsContent value="enhanced" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Enhanced Dashboard</CardTitle>
                <CardDescription>
                  Modern Bento Grid layout with visual effects and improved spacing. Features hover animations and better visual hierarchy.
                </CardDescription>
              </CardHeader>
            </Card>
            
            <EnhancedDashboard 
              dashboardData={dashboardData}
              loading={loading}
              className="space-y-6"
            />
          </TabsContent>
        </Tabs>

        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-green-600">✅ Compact Dashboard</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Perfect for main dashboard integration</li>
                  <li>• Fast loading and minimal resource usage</li>
                  <li>• Better for mobile users</li>
                  <li>• Excellent for daily financial checkups</li>
                  <li>• Fits well in existing layouts</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-blue-600">✨ Enhanced Dashboard</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Great for dedicated dashboard page</li>
                  <li>• Beautiful visual effects and animations</li>
                  <li>• Better for detailed financial analysis</li>
                  <li>• Impressive for new user onboarding</li>
                  <li>• Premium feel for marketing</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
