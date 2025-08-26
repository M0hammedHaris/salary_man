'use client';

import React, { useState, useEffect } from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  AlertTriangle, 
  CheckCircle, 
  X, 
  Clock, 
  CreditCard,
  DollarSign
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface AlertNotificationData {
  id: string;
  accountId: string;
  accountName: string;
  type: 'threshold' | 'limit_exceeded' | 'payment_reminder';
  severity: 'info' | 'warning' | 'error';
  title: string;
  message: string;
  utilizationPercentage: number;
  currentBalance: number;
  creditLimit: number;
  thresholdValue: number;
  createdAt: Date;
  autoHideDelay?: number; // in milliseconds
}

interface AlertNotificationProps {
  alert: AlertNotificationData;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  autoHide?: boolean;
  autoHideDelay?: number;
  showProgress?: boolean;
  onAcknowledge?: (alertId: string) => void;
  onSnooze?: (alertId: string, hours: number) => void;
  onDismiss?: (alertId: string) => void;
  className?: string;
}

interface AlertNotificationContainerProps {
  alerts: AlertNotificationData[];
  position?: AlertNotificationProps['position'];
  maxAlerts?: number;
  className?: string;
  onAcknowledge?: (alertId: string) => void;
  onSnooze?: (alertId: string, hours: number) => void;
  onDismiss?: (alertId: string) => void;
}

export function AlertNotification({
  alert,
  position = 'top-right',
  autoHide = true,
  autoHideDelay = 8000,
  showProgress = true,
  onAcknowledge,
  onSnooze,
  onDismiss,
  className
}: AlertNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [timeLeft, setTimeLeft] = useState(autoHideDelay);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!autoHide || isPaused) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 100) {
          setIsVisible(false);
          return 0;
        }
        return prev - 100;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [autoHide, isPaused]);

  const getSeverityConfig = (severity: AlertNotificationData['severity']) => {
    switch (severity) {
      case 'error':
        return {
          variant: 'destructive' as const,
          icon: <AlertTriangle className="h-4 w-4" />,
          borderColor: 'border-red-500',
          bgColor: 'bg-red-50',
        };
      case 'warning':
        return {
          variant: 'default' as const,
          icon: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
          borderColor: 'border-yellow-500',
          bgColor: 'bg-yellow-50',
        };
      case 'info':
        return {
          variant: 'default' as const,
          icon: <CheckCircle className="h-4 w-4 text-blue-500" />,
          borderColor: 'border-blue-500',
          bgColor: 'bg-blue-50',
        };
      default:
        return {
          variant: 'default' as const,
          icon: <AlertTriangle className="h-4 w-4" />,
          borderColor: 'border-gray-500',
          bgColor: 'bg-gray-50',
        };
    }
  };

  const getPositionClasses = (pos: AlertNotificationProps['position']) => {
    switch (pos) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-center':
        return 'top-4 left-1/2 transform -translate-x-1/2';
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-center':
        return 'bottom-4 left-1/2 transform -translate-x-1/2';
      case 'bottom-right':
        return 'bottom-4 right-4';
      default:
        return 'top-4 right-4';
    }
  };

  const config = getSeverityConfig(alert.severity);
  const progressPercentage = autoHide && showProgress ? (timeLeft / autoHideDelay) * 100 : 0;

  if (!isVisible) return null;

  return (
    <div 
      className={cn(
        'fixed z-50 w-96 max-w-sm transition-all duration-300 ease-in-out',
        getPositionClasses(position),
        'animate-in slide-in-from-right-full',
        className
      )}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <Alert 
        variant={config.variant}
        className={cn(
          'border-l-4 shadow-lg',
          config.borderColor,
          config.bgColor
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            {config.icon}
            <AlertTitle className="text-sm font-semibold">
              {alert.title}
            </AlertTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsVisible(false);
              onDismiss?.(alert.id);
            }}
            className="h-6 w-6 p-0 hover:bg-gray-200"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>

        {/* Account Info */}
        <div className="flex items-center gap-2 mb-2 text-xs text-gray-600">
          <CreditCard className="h-3 w-3" />
          <span>{alert.accountName}</span>
          <Badge variant="outline" className="text-xs px-1 py-0">
            {alert.utilizationPercentage.toFixed(1)}%
          </Badge>
        </div>

        {/* Message */}
        <AlertDescription className="text-sm text-gray-700 mb-3">
          {alert.message}
        </AlertDescription>

        {/* Financial Details */}
        <div className="grid grid-cols-2 gap-2 text-xs bg-white/70 rounded p-2 mb-3">
          <div className="flex items-center gap-1">
            <DollarSign className="h-3 w-3 text-gray-500" />
            <span className="text-gray-600">Balance:</span>
            <span className="font-medium">₹{Math.abs(alert.currentBalance).toLocaleString('en-IN')}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-gray-600">Limit:</span>
            <span className="font-medium">₹{alert.creditLimit.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Timestamp */}
        <div className="text-xs text-gray-500 mb-3">
          {formatDistanceToNow(alert.createdAt, { addSuffix: true })}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 mb-2">
          {onAcknowledge && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onAcknowledge(alert.id);
                setIsVisible(false);
              }}
              className="h-7 text-xs flex-1"
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Acknowledge
            </Button>
          )}
          {onSnooze && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onSnooze(alert.id, 24);
                setIsVisible(false);
              }}
              className="h-7 text-xs flex-1"
            >
              <Clock className="h-3 w-3 mr-1" />
              Snooze
            </Button>
          )}
        </div>

        {/* Progress Bar */}
        {autoHide && showProgress && (
          <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
            <div
              className={cn(
                'h-1 rounded-full transition-all duration-100 ease-linear',
                alert.severity === 'error' ? 'bg-red-500' :
                alert.severity === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
              )}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        )}
      </Alert>
    </div>
  );
}

export function AlertNotificationContainer({
  alerts,
  position = 'top-right',
  maxAlerts = 3,
  className,
  onAcknowledge,
  onSnooze,
  onDismiss
}: AlertNotificationContainerProps) {
  const [visibleAlerts, setVisibleAlerts] = useState<AlertNotificationData[]>([]);

  useEffect(() => {
    // Sort alerts by severity and time, then limit to maxAlerts
    const sortedAlerts = [...alerts]
      .sort((a, b) => {
        // Priority: error > warning > info
        const severityOrder = { error: 3, warning: 2, info: 1 };
        const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
        if (severityDiff !== 0) return severityDiff;
        
        // Then by time (newest first)
        return b.createdAt.getTime() - a.createdAt.getTime();
      })
      .slice(0, maxAlerts);

    setVisibleAlerts(sortedAlerts);
  }, [alerts, maxAlerts]);

  const handleDismiss = (alertId: string) => {
    setVisibleAlerts(prev => prev.filter(alert => alert.id !== alertId));
    onDismiss?.(alertId);
  };

  return (
    <div className={cn('fixed z-50', className)}>
      {visibleAlerts.map((alert, index) => (
        <div
          key={alert.id}
          style={{
            position: 'absolute',
            top: position.includes('top') ? `${index * 120}px` : 'auto',
            bottom: position.includes('bottom') ? `${index * 120}px` : 'auto',
            right: position.includes('right') ? '0' : 'auto',
            left: position.includes('left') ? '0' : 'auto',
            transform: position.includes('center') ? 'translateX(-50%)' : 'none',
          }}
        >
          <AlertNotification
            alert={alert}
            position={position}
            onAcknowledge={onAcknowledge}
            onSnooze={onSnooze}
            onDismiss={handleDismiss}
          />
        </div>
      ))}
    </div>
  );
}

export default AlertNotification;
