"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils/decimal';
import { format } from 'date-fns';
import { 
  Receipt, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  ArrowRight,
  ShoppingBag,
  Car,
  Home,
  Coffee,
  Gamepad2,
  Heart,
  Briefcase
} from 'lucide-react';

interface RecentTransactionsProps {
  transactions: Array<{
    id: string;
    description: string;
    amount: number;
    categoryName: string;
    categoryColor: string;
    transactionDate: Date;
    accountName: string;
  }>;
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const [expandedTransaction, setExpandedTransaction] = useState<string | null>(null);

  const getCategoryIcon = (categoryName: string) => {
    const category = categoryName.toLowerCase();
    if (category.includes('groceries') || category.includes('food') || category.includes('restaurant')) {
      return <Coffee className="h-4 w-4" />;
    }
    if (category.includes('transport') || category.includes('gas') || category.includes('car')) {
      return <Car className="h-4 w-4" />;
    }
    if (category.includes('shopping') || category.includes('retail')) {
      return <ShoppingBag className="h-4 w-4" />;
    }
    if (category.includes('home') || category.includes('utilities')) {
      return <Home className="h-4 w-4" />;
    }
    if (category.includes('entertainment') || category.includes('fun')) {
      return <Gamepad2 className="h-4 w-4" />;
    }
    if (category.includes('health') || category.includes('medical')) {
      return <Heart className="h-4 w-4" />;
    }
    if (category.includes('salary') || category.includes('income') || category.includes('work')) {
      return <Briefcase className="h-4 w-4" />;
    }
    return <Receipt className="h-4 w-4" />;
  };

  const getAmountColor = (amount: number) => {
    return amount > 0 ? 'text-green-600' : 'text-red-600';
  };

  const getAmountIcon = (amount: number) => {
    return amount > 0 ? TrendingUp : TrendingDown;
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg">Recent Transactions</CardTitle>
        <Badge variant="outline" className="text-xs">
          {transactions.length} Recent
        </Badge>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Receipt className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium mb-1">No Recent Transactions</p>
            <p className="text-sm">Your transactions will appear here once you start adding them.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="border rounded-lg overflow-hidden">
                {/* Transaction Summary */}
                <div 
                  className={`p-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                    expandedTransaction === transaction.id ? 'bg-muted/30' : ''
                  }`}
                  onClick={() => setExpandedTransaction(
                    expandedTransaction === transaction.id ? null : transaction.id
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="p-2 rounded-full"
                        style={{ backgroundColor: `${transaction.categoryColor}15` }}
                      >
                        <div style={{ color: transaction.categoryColor }}>
                          {getCategoryIcon(transaction.categoryName)}
                        </div>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium text-sm truncate">{transaction.description}</span>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <span className="truncate">{transaction.categoryName}</span>
                          <span className="hidden sm:inline">•</span>
                          <span className="hidden sm:inline truncate">{transaction.accountName}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className="text-right">
                        <div className={`font-semibold text-sm ${getAmountColor(transaction.amount)}`}>
                          {transaction.amount > 0 ? '+' : ''}
                          {formatCurrency(transaction.amount)}
                        </div>
                        <div className="flex items-center justify-end space-x-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{format(transaction.transactionDate, 'MMM dd')}</span>
                        </div>
                      </div>
                        {React.createElement(getAmountIcon(transaction.amount), { className: 'h-4 w-4' })}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedTransaction === transaction.id && (
                  <div className="px-3 pb-3 pt-1 bg-muted/20 border-t">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Date:</span>
                        <p className="font-medium">{format(transaction.transactionDate, 'PPP')}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Account:</span>
                        <p className="font-medium">{transaction.accountName}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Category:</span>
                        <div className="flex items-center space-x-1">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: transaction.categoryColor }}
                          />
                          <span className="font-medium">{transaction.categoryName}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Type:</span>
                        <p className="font-medium">
                          {transaction.amount > 0 ? 'Income' : 'Expense'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 mt-3 pt-2 border-t border-muted">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="sm" className="text-xs">
                            Edit
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Edit this transaction</p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="sm" className="text-xs">
                            Duplicate
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Create a similar transaction</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* View All Transactions Link */}
            <div className="pt-2">
              <Button variant="ghost" className="w-full text-sm" size="sm" asChild>
                <Link href="/transactions">
                  <span>View All Transactions</span>
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
