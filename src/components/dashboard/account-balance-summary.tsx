"use client";

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatCurrency } from '@/lib/utils/decimal';
import { CreditCard, PiggyBank, Wallet, AlertCircle, CheckCircle, Settings, Bell } from 'lucide-react';
import { UtilizationIndicator } from '@/components/alerts/utilization-indicator';
import { useState, useEffect } from 'react';

interface AccountSummaryProps {
  totalBalance: number;
  checkingBalance: number;
  savingsBalance: number;
  creditCardBalance: number;
  accounts: Array<{
    id: string;
    name: string;
    type: string;
    balance: number;
    creditLimit?: number;
    status: 'positive' | 'negative' | 'alert';
  }>;
}

interface UtilizationData {
  accountId: string;
  utilizationPercentage: number;
  utilizationAmount: number;
  availableCredit: number;
  creditLimit: number;
}

export function AccountBalanceSummary({
  totalBalance,
  checkingBalance,
  savingsBalance,
  creditCardBalance,
  accounts
}: AccountSummaryProps) {
  const [utilizationData, setUtilizationData] = useState<UtilizationData[]>([]);
  const [hasAlerts, setHasAlerts] = useState(false);

  useEffect(() => {
    // Fetch utilization data for credit card accounts
    const fetchUtilizationData = async () => {
      try {
        const response = await fetch('/api/accounts/utilization');
        if (response.ok) {
          const data = await response.json();
          setUtilizationData(data.data || []);
          
          // Check if any account has high utilization (>= 70%)
          const hasHighUtilization = data.data?.some((account: UtilizationData) => 
            account.utilizationPercentage >= 70
          );
          setHasAlerts(hasHighUtilization || false);
        }
      } catch (error) {
        console.error('Failed to fetch utilization data:', error);
      }
    };

    fetchUtilizationData();
  }, []);
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'positive':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'alert':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'positive':
        return 'text-green-600';
      case 'alert':
        return 'text-red-600';
      default:
        return 'text-yellow-600';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'checking':
        return <Wallet className="h-4 w-4 text-blue-600" />;
      case 'savings':
        return <PiggyBank className="h-4 w-4 text-green-600" />;
      case 'credit_card':
        return <CreditCard className="h-4 w-4 text-purple-600" />;
      default:
        return <Wallet className="h-4 w-4 text-gray-600" />;
    }
  };

  const getAccountTypeLabel = (type: string) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Account Summary</CardTitle>
          {hasAlerts && (
            <Link href="/dashboard/alerts" passHref>
              <Button variant="outline" size="sm" className="text-orange-600 border-orange-200">
                <Bell className="h-4 w-4 mr-1" />
                Alerts
              </Button>
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Balance */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center space-x-2">
            <Wallet className="h-5 w-5 text-primary" />
            <span className="font-medium">Total Balance</span>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={`text-xl font-bold cursor-help ${
                totalBalance >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(totalBalance)}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Sum of all checking, savings, and credit card balances</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Balance Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Checking */}
          <div className="flex items-center justify-between p-2 border rounded">
            <div className="flex items-center space-x-2">
              <Wallet className="h-4 w-4 text-blue-600" />
              <span className="text-sm">Checking</span>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className={`text-sm font-medium cursor-help ${
                  checkingBalance >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(checkingBalance)}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Total balance across all checking accounts</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Savings */}
          <div className="flex items-center justify-between p-2 border rounded">
            <div className="flex items-center space-x-2">
              <PiggyBank className="h-4 w-4 text-green-600" />
              <span className="text-sm">Savings</span>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className={`text-sm font-medium cursor-help ${
                  savingsBalance >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(savingsBalance)}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Total balance across all savings accounts</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Credit Cards */}
          <div className="flex items-center justify-between p-2 border rounded">
            <div className="flex items-center space-x-2">
              <CreditCard className="h-4 w-4 text-purple-600" />
              <span className="text-sm">Credit</span>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className={`text-sm font-medium cursor-help ${
                  creditCardBalance <= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(creditCardBalance)}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Total debt across all credit cards</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Individual Accounts */}
        {accounts.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Individual Accounts</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {accounts.map((account) => {
                const utilization = utilizationData.find(u => u.accountId === account.id);
                
                return (
                  <div key={account.id} className="space-y-2">
                    <div className="flex items-center justify-between p-2 border rounded-sm">
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(account.type)}
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{account.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {getAccountTypeLabel(account.type)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm font-medium ${getStatusColor(account.status)}`}>
                          {formatCurrency(account.balance)}
                        </span>
                        {getStatusIcon(account.status)}
                      </div>
                    </div>
                    
                    {/* Show utilization indicator for credit cards */}
                    {account.type === 'credit_card' && utilization && account.creditLimit && (
                      <UtilizationIndicator
                        utilizationPercentage={utilization.utilizationPercentage}
                        currentBalance={account.balance}
                        creditLimit={account.creditLimit}
                        accountName={account.name}
                        size="sm"
                        showDetails={false}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {accounts.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            <p className="text-sm">No accounts found. Add your first account to get started.</p>
          </div>
        )}

        {/* Navigation to Account Management */}
        <div className="pt-3 border-t">
          <Link href="/accounts" passHref>
            <Button variant="outline" size="sm" className="w-full">
              <Settings className="h-4 w-4 mr-2" />
              Manage Accounts
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
