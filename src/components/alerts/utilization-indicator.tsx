'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';

interface UtilizationIndicatorProps {
  utilizationPercentage: number;
  currentBalance: number;
  creditLimit: number;
  accountName?: string;
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

interface UtilizationStatus {
  level: 'safe' | 'warning' | 'danger' | 'critical';
  color: string;
  bgColor: string;
  icon: React.ReactNode;
  label: string;
  progressColor: string;
}

function getUtilizationStatus(percentage: number): UtilizationStatus {
  if (percentage >= 90) {
    return {
      level: 'critical',
      color: 'text-red-700',
      bgColor: 'bg-red-50 border-red-200',
      icon: <AlertTriangle className="h-4 w-4" />,
      label: 'Critical',
      progressColor: 'bg-red-600',
    };
  } else if (percentage >= 70) {
    return {
      level: 'danger',
      color: 'text-orange-700',
      bgColor: 'bg-orange-50 border-orange-200',
      icon: <AlertCircle className="h-4 w-4" />,
      label: 'High',
      progressColor: 'bg-orange-500',
    };
  } else if (percentage >= 50) {
    return {
      level: 'warning',
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-50 border-yellow-200',
      icon: <AlertTriangle className="h-4 w-4" />,
      label: 'Moderate',
      progressColor: 'bg-yellow-500',
    };
  } else {
    return {
      level: 'safe',
      color: 'text-green-700',
      bgColor: 'bg-green-50 border-green-200',
      icon: <CheckCircle className="h-4 w-4" />,
      label: 'Good',
      progressColor: 'bg-green-500',
    };
  }
}

export function UtilizationIndicator({
  utilizationPercentage,
  currentBalance,
  creditLimit,
  accountName,
  showDetails = true,
  size = 'md',
  className
}: UtilizationIndicatorProps) {
  const status = getUtilizationStatus(utilizationPercentage);
  const availableCredit = creditLimit + currentBalance; // currentBalance is negative for credit cards

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const progressHeight = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3'
  };

  return (
    <div className={cn(
      'rounded-lg border p-3 transition-colors',
      status.bgColor,
      sizeClasses[size],
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={cn('flex-shrink-0', status.color)}>
            {status.icon}
          </span>
          {accountName && (
            <span className="font-medium text-gray-900 truncate">
              {accountName}
            </span>
          )}
        </div>
        <Badge 
          variant={status.level === 'critical' || status.level === 'danger' ? 'destructive' : 'outline'}
          className={cn(
            'text-xs',
            status.level === 'warning' && 'bg-yellow-100 text-yellow-800 border-yellow-300',
            status.level === 'safe' && 'bg-green-100 text-green-800 border-green-300'
          )}
        >
          {status.label}
        </Badge>
      </div>

      {/* Progress Bar */}
      <div className="mb-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-600">Credit Utilization</span>
          <span className={cn('text-xs font-medium', status.color)}>
            {utilizationPercentage.toFixed(1)}%
          </span>
        </div>
        <div className={cn('w-full bg-gray-200 rounded-full overflow-hidden', progressHeight[size])}>
          <div
            className={cn('h-full transition-all duration-300 rounded-full', status.progressColor)}
            style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Details */}
      {showDetails && (
        <div className="space-y-1 text-xs text-gray-600">
          <div className="flex justify-between">
            <span>Current Balance:</span>
            <span className="font-medium">
              ₹{Math.abs(currentBalance).toLocaleString('en-IN')}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Credit Limit:</span>
            <span className="font-medium">₹{creditLimit.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between">
            <span>Available Credit:</span>
            <span className={cn(
              'font-medium',
              availableCredit < creditLimit * 0.1 ? 'text-red-600' : 'text-green-600'
            )}>
              ₹{availableCredit.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      )}

      {/* Usage Recommendations */}
      {status.level !== 'safe' && showDetails && (
        <div className="mt-3 p-2 bg-white/50 rounded border border-current/20">
          <p className={cn('text-xs', status.color)}>
            {status.level === 'critical' && (
              'Consider paying down your balance immediately to avoid credit score impact.'
            )}
            {status.level === 'danger' && (
              'High utilization may impact your credit score. Consider making a payment.'
            )}
            {status.level === 'warning' && (
              'Monitor your spending to keep utilization below 30% for optimal credit health.'
            )}
          </p>
        </div>
      )}
    </div>
  );
}

export default UtilizationIndicator;
