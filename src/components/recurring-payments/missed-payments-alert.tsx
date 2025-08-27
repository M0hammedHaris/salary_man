"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  CreditCard,
  ExternalLink,
  Calendar,
  DollarSign,
} from 'lucide-react';
import type { MissedPaymentAlert } from '../../lib/types/bill-types';

interface MissedPaymentsAlertProps {
  missedPayments: MissedPaymentAlert[];
  onMarkAsPaid: (paymentId: string) => void;
  onSnooze: (paymentId: string, days: number) => void;
  onViewDetails: (paymentId: string) => void;
}

export function MissedPaymentsAlert({
  missedPayments,
  onMarkAsPaid,
  onSnooze,
  onViewDetails,
}: MissedPaymentsAlertProps) {
  const criticalPayments = missedPayments?.filter(p => p.daysOverdue >= 7) || [];
  const recentMissed = missedPayments?.filter(p => p.daysOverdue < 7) || [];

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString()}`;
  };

  const getPriorityColor = (daysOverdue: number) => {
    if (daysOverdue >= 7) return 'bg-red-100 text-red-800 border-red-200';
    if (daysOverdue >= 3) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  };

  const getPriorityLabel = (daysOverdue: number) => {
    if (daysOverdue >= 7) return 'Critical';
    if (daysOverdue >= 3) return 'High Priority';
    return 'Attention Needed';
  };

  if (!missedPayments || missedPayments.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
            <h3 className="text-lg font-medium mb-2">All Payments on Track</h3>
            <p className="text-muted-foreground">
              No missed payments detected. Great job staying on top of your recurring expenses!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <AlertCircle className="h-6 w-6 text-red-600" />
        <div>
          <h2 className="text-xl font-semibold">Missed Payments</h2>
          <p className="text-sm text-muted-foreground">
            {missedPayments.length} payment{missedPayments.length !== 1 ? 's' : ''} require{missedPayments.length === 1 ? 's' : ''} your attention
          </p>
        </div>
      </div>

      {/* Critical Payments */}
      {criticalPayments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>Critical - Immediate Action Required</span>
            </CardTitle>
            <CardDescription>
              These payments are significantly overdue and may incur additional fees
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {criticalPayments.map((payment) => (
              <div
                key={payment.recurringPaymentId}
                className="border border-red-200 rounded-lg p-4 bg-red-50"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-medium">{payment.paymentName}</h3>
                      <Badge className={getPriorityColor(payment.daysOverdue)}>
                        {payment.daysOverdue} days overdue
                      </Badge>
                      {payment.missedConsecutivePayments > 1 && (
                        <Badge variant="destructive">
                          {payment.missedConsecutivePayments} consecutive misses
                        </Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground">Amount</p>
                          <p className="font-medium">{formatCurrency(payment.expectedAmount)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground">Expected Date</p>
                          <p className="font-medium">
                            {new Date(payment.expectedDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground">Account</p>
                          <p className="font-medium">{payment.accountName}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground">Last Payment</p>
                          <p className="font-medium">
                            {payment.lastPaymentDate
                              ? new Date(payment.lastPaymentDate).toLocaleDateString()
                              : 'N/A'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="text-sm text-red-600 font-medium">
                    {getPriorityLabel(payment.daysOverdue)}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onViewDetails(payment.recurringPaymentId)}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Details
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => onMarkAsPaid(payment.recurringPaymentId)}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark as Paid
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recent Missed Payments */}
      {recentMissed.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-orange-600">
              <Clock className="h-5 w-5" />
              <span>Recently Missed</span>
            </CardTitle>
            <CardDescription>
              These payments are overdue but still within the grace period
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentMissed.map((payment) => (
              <div
                key={payment.recurringPaymentId}
                className="border rounded-lg p-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-medium">{payment.paymentName}</h3>
                      <Badge className={getPriorityColor(payment.daysOverdue)}>
                        {payment.daysOverdue} day{payment.daysOverdue !== 1 ? 's' : ''} overdue
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Amount</p>
                        <p className="font-medium">{formatCurrency(payment.expectedAmount)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Expected Date</p>
                        <p className="font-medium">
                          {new Date(payment.expectedDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Account</p>
                        <p className="font-medium">{payment.accountName}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="text-sm text-muted-foreground">
                    {payment.description || 'Recurring payment'}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onSnooze(payment.recurringPaymentId, 3)}
                    >
                      Snooze 3d
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onViewDetails(payment.recurringPaymentId)}
                    >
                      Details
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => onMarkAsPaid(payment.recurringPaymentId)}
                    >
                      Mark as Paid
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Summary Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Payment Management Tips</AlertTitle>
        <AlertDescription>
          <ul className="list-disc list-inside space-y-1">
            <li>Set up automatic payments to avoid future missed payments</li>
            <li>Enable notifications to get alerts before due dates</li>
            <li>Review and update payment schedules regularly</li>
            <li>Consider consolidating payment dates to simplify management</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
}
