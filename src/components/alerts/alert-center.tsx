'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  Bell, 
  CheckCircle, 
  Clock, 
  X, 
  AlertTriangle, 
  CreditCard,
  Archive,
  Settings
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface AlertItem {
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
  isRead: boolean;
  isAcknowledged: boolean;
  isSnoozed: boolean;
  snoozeUntil?: Date;
  createdAt: Date;
  acknowledgedAt?: Date;
}

interface AlertCenterProps {
  className?: string;
  showFilter?: boolean;
  showSettings?: boolean;
  maxHeight?: string;
}

const MOCK_ALERTS: AlertItem[] = [
  {
    id: '1',
    accountId: 'acc-1',
    accountName: 'HDFC Credit Card',
    type: 'threshold',
    severity: 'warning',
    title: 'Credit Utilization Alert',
    message: 'Your credit card utilization has reached 75% of your credit limit.',
    utilizationPercentage: 75.5,
    currentBalance: -75500,
    creditLimit: 100000,
    thresholdValue: 70,
    isRead: false,
    isAcknowledged: false,
    isSnoozed: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  },
  {
    id: '2',
    accountId: 'acc-2',
    accountName: 'SBI Credit Card',
    type: 'threshold',
    severity: 'error',
    title: 'High Credit Utilization',
    message: 'Your credit card utilization has exceeded 90% of your credit limit.',
    utilizationPercentage: 92.3,
    currentBalance: -138450,
    creditLimit: 150000,
    thresholdValue: 90,
    isRead: true,
    isAcknowledged: false,
    isSnoozed: false,
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
  },
  {
    id: '3',
    accountId: 'acc-1',
    accountName: 'HDFC Credit Card',
    type: 'threshold',
    severity: 'info',
    title: 'Utilization Decreased',
    message: 'Great! Your credit utilization is now below 50%.',
    utilizationPercentage: 45.2,
    currentBalance: -45200,
    creditLimit: 100000,
    thresholdValue: 50,
    isRead: true,
    isAcknowledged: true,
    isSnoozed: false,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    acknowledgedAt: new Date(Date.now() - 23 * 60 * 60 * 1000),
  }
];

export function AlertCenter({ 
  className, 
  showFilter = true, 
  showSettings = true,
  maxHeight = "600px" 
}: AlertCenterProps) {
  const [alerts, setAlerts] = useState<AlertItem[]>(MOCK_ALERTS);
  const [filter, setFilter] = useState<'all' | 'unread' | 'acknowledged'>('all');
  const [loading, setLoading] = useState(false);

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'unread') return !alert.isRead;
    if (filter === 'acknowledged') return alert.isAcknowledged;
    return true;
  });

  const unreadCount = alerts.filter(alert => !alert.isRead).length;

  const handleAcknowledge = async (alertId: string) => {
    setLoading(true);
    try {
      // TODO: Call API to acknowledge alert
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, isAcknowledged: true, acknowledgedAt: new Date() }
          : alert
      ));
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSnooze = async (alertId: string, hours: number = 24) => {
    setLoading(true);
    try {
      // TODO: Call API to snooze alert
      const snoozeUntil = new Date(Date.now() + hours * 60 * 60 * 1000);
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, isSnoozed: true, snoozeUntil }
          : alert
      ));
    } catch (error) {
      console.error('Failed to snooze alert:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = async (alertId: string) => {
    setLoading(true);
    try {
      // TODO: Call API to dismiss alert
      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    } catch (error) {
      console.error('Failed to dismiss alert:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, isRead: true }
        : alert
    ));
  };

  const getSeverityIcon = (severity: AlertItem['severity']) => {
    switch (severity) {
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: AlertItem['severity']) => {
    switch (severity) {
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'info':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bell className="h-5 w-5 text-gray-700" />
              {unreadCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
                >
                  {unreadCount}
                </Badge>
              )}
            </div>
            <CardTitle className="text-lg">Alert Center</CardTitle>
          </div>
          
          <div className="flex items-center gap-2">
            {showFilter && (
              <div className="flex items-center gap-1 border rounded-lg p-1">
                <Button 
                  variant={filter === 'all' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setFilter('all')}
                  className="h-7 px-2 text-xs"
                >
                  All
                </Button>
                <Button 
                  variant={filter === 'unread' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setFilter('unread')}
                  className="h-7 px-2 text-xs"
                >
                  Unread
                </Button>
                <Button 
                  variant={filter === 'acknowledged' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setFilter('acknowledged')}
                  className="h-7 px-2 text-xs"
                >
                  Archived
                </Button>
              </div>
            )}
            
            {showSettings && (
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Settings className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div 
          className="space-y-2 max-h-full overflow-y-auto px-6 pb-6"
          style={{ maxHeight }}
        >
          {filteredAlerts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-sm">
                {filter === 'all' ? 'No alerts to display' : 
                 filter === 'unread' ? 'No unread alerts' : 
                 'No archived alerts'}
              </p>
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className={cn(
                  'relative border rounded-lg p-4 transition-all duration-200',
                  getSeverityColor(alert.severity),
                  !alert.isRead && 'ring-2 ring-blue-200',
                  alert.isSnoozed && 'opacity-60'
                )}
                onClick={() => !alert.isRead && handleMarkAsRead(alert.id)}
              >
                {/* Alert Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3 flex-1">
                    {getSeverityIcon(alert.severity)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className={cn(
                          'text-sm font-medium truncate',
                          !alert.isRead && 'font-semibold'
                        )}>
                          {alert.title}
                        </h4>
                        {!alert.isRead && (
                          <div className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0" />
                        )}
                        {alert.isSnoozed && (
                          <Clock className="h-3 w-3 text-gray-400 flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <CreditCard className="h-3 w-3" />
                        <span>{alert.accountName}</span>
                        <span>•</span>
                        <span>{formatDistanceToNow(alert.createdAt, { addSuffix: true })}</span>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDismiss(alert.id);
                    }}
                    className="h-6 w-6 p-0 hover:bg-red-100"
                    disabled={loading}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>

                {/* Alert Message */}
                <p className="text-sm text-gray-700 mb-3">{alert.message}</p>

                {/* Utilization Info */}
                <div className="flex items-center justify-between text-xs bg-white/50 rounded p-2 mb-3">
                  <span>Utilization: <strong>{alert.utilizationPercentage.toFixed(1)}%</strong></span>
                  <span>Balance: <strong>₹{Math.abs(alert.currentBalance).toLocaleString('en-IN')}</strong></span>
                  <span>Limit: <strong>₹{alert.creditLimit.toLocaleString('en-IN')}</strong></span>
                </div>

                {/* Action Buttons */}
                {!alert.isAcknowledged && !alert.isSnoozed && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAcknowledge(alert.id);
                      }}
                      disabled={loading}
                      className="h-7 text-xs"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Acknowledge
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSnooze(alert.id);
                      }}
                      disabled={loading}
                      className="h-7 text-xs"
                    >
                      <Clock className="h-3 w-3 mr-1" />
                      Snooze 24h
                    </Button>
                  </div>
                )}

                {alert.isAcknowledged && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Archive className="h-3 w-3" />
                    <span>
                      Acknowledged {alert.acknowledgedAt && formatDistanceToNow(alert.acknowledgedAt, { addSuffix: true })}
                    </span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default AlertCenter;
