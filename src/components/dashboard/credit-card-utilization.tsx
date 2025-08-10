"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatCurrency } from '@/lib/utils/decimal';
import { CreditCard, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';

interface CreditCardUtilizationProps {
  creditCards: Array<{
    accountId: string;
    accountName: string;
    utilization: number;
    balance: number;
    creditLimit: number;
    status: 'good' | 'warning' | 'danger';
  }>;
}

export function CreditCardUtilization({ creditCards }: CreditCardUtilizationProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'danger':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'good':
        return 'default';
      case 'warning':
        return 'secondary';
      case 'danger':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'good':
        return 'Excellent';
      case 'warning':
        return 'Fair';
      case 'danger':
        return 'High';
      default:
        return 'Unknown';
    }
  };

  const averageUtilization = creditCards.length > 0
    ? Math.round(creditCards.reduce((sum, card) => sum + card.utilization, 0) / creditCards.length)
    : 0;

  const overallStatus = creditCards.length > 0
    ? creditCards.some(card => card.status === 'danger') ? 'danger'
      : creditCards.some(card => card.status === 'warning') ? 'warning'
      : 'good'
    : 'good';

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg">Credit Utilization</CardTitle>
        <div className="flex items-center space-x-2">
          {getStatusIcon(overallStatus)}
          <Badge variant={getStatusBadgeVariant(overallStatus)}>
            {averageUtilization}% Avg
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {creditCards.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <CreditCard className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No credit cards found.</p>
            <p className="text-xs">Add a credit card to track utilization.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Overall Summary */}
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Average Utilization</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className={`text-lg font-bold cursor-help ${
                      averageUtilization < 30 ? 'text-green-600' 
                      : averageUtilization < 70 ? 'text-yellow-600' 
                      : 'text-red-600'
                    }`}>
                      {averageUtilization}%
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Keep utilization below 30% for optimal credit score</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Progress 
                value={averageUtilization} 
                className="h-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>0%</span>
                <span className="text-yellow-600">30%</span>
                <span className="text-red-600">70%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Individual Cards */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Individual Cards</h4>
              {creditCards.map((card) => (
                <div key={card.accountId} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="h-4 w-4 text-purple-600" />
                      <span className="font-medium text-sm">{card.accountName}</span>
                      {getStatusIcon(card.status)}
                    </div>
                    <Badge variant={getStatusBadgeVariant(card.status)} className="text-xs">
                      {getStatusLabel(card.status)}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Utilization</span>
                      <span className={`font-medium ${
                        card.utilization < 30 ? 'text-green-600' 
                        : card.utilization < 70 ? 'text-yellow-600' 
                        : 'text-red-600'
                      }`}>
                        {card.utilization}%
                      </span>
                    </div>
                    <Progress 
                      value={card.utilization} 
                      className="h-1.5"
                    />
                  </div>

                  <div className="flex justify-between text-xs text-muted-foreground">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-help">
                          Balance: {formatCurrency(Math.abs(card.balance))}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Current outstanding balance on this card</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-help">
                          Limit: {formatCurrency(card.creditLimit)}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Maximum credit limit for this card</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              ))}
            </div>

            {/* Utilization Tips */}
            <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-blue-800 dark:text-blue-200">
                  <p className="font-medium mb-1">Utilization Tips:</p>
                  <ul className="space-y-0.5 text-xs">
                    <li>• Keep utilization below 30% for good credit</li>
                    <li>• Below 10% is considered excellent</li>
                    <li>• Pay multiple times per month to keep balances low</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
