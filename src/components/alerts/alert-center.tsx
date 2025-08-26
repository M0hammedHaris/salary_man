'use client';

import React, { useState, useEffect } from 'react';
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
  alertType: 'credit_utilization' | 'low_balance' | 'spending_limit' | 'unusual_activity';
  message: string;
  currentValue: string;
  thresholdValue: string;
  status: 'triggered' | 'acknowledged' | 'dismissed' | 'snoozed';
  triggeredAt: string;
  acknowledgedAt?: string;
  snoozeUntil?: string;
  updatedAt: string;
  createdAt: string;
}

interface AlertCenterProps {
  className?: string;
  showFilter?: boolean;
  showSettings?: boolean;
  maxHeight?: string;
}

export function AlertCenter({ 
  className, 
  showFilter = true, 
  showSettings = true,
  maxHeight = "600px" 
}: AlertCenterProps) {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'acknowledged'>('all');
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<Record<string, { name: string; type: string }>>({});

  // Fetch alerts and account information
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch alerts
        const alertsResponse = await fetch('/api/alerts');
        if (alertsResponse.ok) {
          const alertsData = await alertsResponse.json();
          setAlerts(alertsData.data || []);
        }

        // Fetch accounts for mapping alert account IDs to names
        const accountsResponse = await fetch('/api/accounts');
        if (accountsResponse.ok) {
          const accountsData = await accountsResponse.json();
          const accountMap = accountsData.data?.reduce((acc: Record<string, { name: string; type: string }>, account: { id: string; name: string; type: string }) => {
            acc[account.id] = { name: account.name, type: account.type };
            return acc;
          }, {});
          setAccounts(accountMap || {});
        }
      } catch (error) {
        console.error('Failed to fetch alerts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'unread') return alert.status === 'triggered';
    if (filter === 'acknowledged') return alert.status === 'acknowledged';
    return true;
  });

  const unreadCount = alerts.filter(alert => alert.status === 'triggered').length;

  const handleAcknowledge = async (alertId: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/alerts/acknowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId })
      });

      if (response.ok) {
        setAlerts(prev => prev.map(alert => 
          alert.id === alertId 
            ? { ...alert, status: 'acknowledged' as const, acknowledgedAt: new Date().toISOString() }
            : alert
        ));
      }
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSnooze = async (alertId: string, hours: number = 24) => {
    setLoading(true);
    try {
      const response = await fetch('/api/alerts/snooze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId, snoozeMinutes: hours * 60 })
      });

      if (response.ok) {
        const snoozeUntil = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
        setAlerts(prev => prev.map(alert => 
          alert.id === alertId 
            ? { ...alert, status: 'snoozed' as const, snoozeUntil }
            : alert
        ));
      }
    } catch (error) {
      console.error('Failed to snooze alert:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = async (alertId: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/alerts/dismiss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId })
      });

      if (response.ok) {
        setAlerts(prev => prev.filter(alert => alert.id !== alertId));
      }
    } catch (error) {
      console.error('Failed to dismiss alert:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityFromMessage = (message: string, currentValue: string) => {
    const current = parseFloat(currentValue);
    
    if (current >= 90) return 'critical';
    if (current >= 70) return 'danger';
    if (current >= 50) return 'warning';
    return 'safe';
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'danger':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'danger':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  const getTitleFromAlertType = (alertType: string) => {
    switch (alertType) {
      case 'credit_utilization':
        return 'Credit Utilization Alert';
      case 'low_balance':
        return 'Low Balance Alert';
      case 'spending_limit':
        return 'Spending Limit Alert';
      case 'unusual_activity':
        return 'Unusual Activity Alert';
      default:
        return 'Financial Alert';
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
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300 animate-pulse" />
              <p className="text-sm">Loading alerts...</p>
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-sm">
                {filter === 'all' ? 'No alerts to display' : 
                 filter === 'unread' ? 'No unread alerts' : 
                 'No archived alerts'}
              </p>
            </div>
          ) : (
            filteredAlerts.map((alert) => {
              const severity = getSeverityFromMessage(alert.message, alert.currentValue);
              const accountInfo = accounts[alert.accountId];
              
              return (
                <div
                  key={alert.id}
                  className={cn(
                    'relative border rounded-lg p-4 transition-all duration-200',
                    getSeverityColor(severity),
                    alert.status === 'triggered' && 'ring-2 ring-blue-200',
                    alert.status === 'snoozed' && 'opacity-60'
                  )}
                >
                  {/* Alert Header */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3 flex-1">
                      {getSeverityIcon(severity)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className={cn(
                            'text-sm font-medium truncate',
                            alert.status === 'triggered' && 'font-semibold'
                          )}>
                            {getTitleFromAlertType(alert.alertType)}
                          </h4>
                          {alert.status === 'triggered' && (
                            <div className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0" />
                          )}
                          {alert.status === 'snoozed' && (
                            <Clock className="h-3 w-3 text-gray-400 flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <CreditCard className="h-3 w-3" />
                          <span>{accountInfo?.name || 'Unknown Account'}</span>
                          <span>•</span>
                          <span>{formatDistanceToNow(new Date(alert.triggeredAt), { addSuffix: true })}</span>
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
                    <span>Current Value: <strong>{alert.currentValue}</strong></span>
                    <span>Threshold: <strong>{alert.thresholdValue}</strong></span>
                  </div>

                  {/* Action Buttons */}
                  {alert.status === 'triggered' && (
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

                  {alert.status === 'acknowledged' && alert.acknowledgedAt && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Archive className="h-3 w-3" />
                      <span>
                        Acknowledged {formatDistanceToNow(new Date(alert.acknowledgedAt), { addSuffix: true })}
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default AlertCenter;
