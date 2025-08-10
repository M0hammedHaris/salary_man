"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatCurrency } from '@/lib/utils/decimal';
import { CreditCard, PiggyBank, Wallet, AlertCircle, CheckCircle } from 'lucide-react';

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
    status: 'positive' | 'negative' | 'alert';
  }>;
}

export function AccountBalanceSummary({
  totalBalance,
  checkingBalance,
  savingsBalance,
  creditCardBalance,
  accounts
}: AccountSummaryProps) {
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
        <CardTitle className="text-lg">Account Summary</CardTitle>
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
              {accounts.map((account) => (
                <div key={account.id} className="flex items-center justify-between p-2 border rounded-sm">
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
              ))}
            </div>
          </div>
        )}

        {accounts.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            <p className="text-sm">No accounts found. Add your first account to get started.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
