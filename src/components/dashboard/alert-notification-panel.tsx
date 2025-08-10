"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  X, 
  Clock, 
  CheckCircle,
  Bell,
  BellOff
} from 'lucide-react';
import { useState } from 'react';

interface AlertNotificationPanelProps {
  alerts: Array<{
    id: string;
    type: 'warning' | 'info' | 'error';
    priority: 'high' | 'medium' | 'low';
    message: string;
    actionRequired: boolean;
  }>;
}

export function AlertNotificationPanel({ alerts }: AlertNotificationPanelProps) {
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [snoozedAlerts, setSnoozedAlerts] = useState<Set<string>>(new Set());

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-600" />;
      default:
        return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  const getAlertBorderColor = (type: string, priority: string) => {
    if (priority === 'high') {
      return 'border-l-4 border-l-red-500';
    }
    switch (type) {
      case 'error':
        return 'border-l-4 border-l-red-400';
      case 'warning':
        return 'border-l-4 border-l-yellow-400';
      case 'info':
        return 'border-l-4 border-l-blue-400';
      default:
        return 'border-l-4 border-l-gray-400';
    }
  };

  const getAlertBgColor = (type: string) => {
    switch (type) {
      case 'error':
        return 'bg-red-50 dark:bg-red-950';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-950';
      case 'info':
        return 'bg-blue-50 dark:bg-blue-950';
      default:
        return 'bg-gray-50 dark:bg-gray-950';
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const handleDismiss = (alertId: string) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]));
  };

  const handleSnooze = (alertId: string) => {
    setSnoozedAlerts(prev => new Set([...prev, alertId]));
  };

  // Filter out dismissed and snoozed alerts
  const visibleAlerts = alerts.filter(
    alert => !dismissedAlerts.has(alert.id) && !snoozedAlerts.has(alert.id)
  );

  // Sort by priority: high -> medium -> low
  const sortedAlerts = visibleAlerts.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });

  const totalDismissed = dismissedAlerts.size;
  const totalSnoozed = snoozedAlerts.size;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg flex items-center space-x-2">
          <Bell className="h-5 w-5" />
          <span>Alerts</span>
        </CardTitle>
        <div className="flex items-center space-x-2">
          {visibleAlerts.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {visibleAlerts.length} Active
            </Badge>
          )}
          {(totalDismissed > 0 || totalSnoozed > 0) && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="text-xs cursor-help">
                  {totalDismissed + totalSnoozed} Hidden
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>{totalDismissed} dismissed, {totalSnoozed} snoozed</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {visibleAlerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500 opacity-50" />
            <p className="font-medium mb-1">All Clear!</p>
            <p className="text-sm">No active alerts at this time.</p>
            {(totalDismissed > 0 || totalSnoozed > 0) && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="mt-2 text-xs"
                onClick={() => {
                  setDismissedAlerts(new Set());
                  setSnoozedAlerts(new Set());
                }}
              >
                Show Hidden Alerts ({totalDismissed + totalSnoozed})
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {sortedAlerts.map((alert) => (
              <div 
                key={alert.id} 
                className={`rounded-lg p-4 ${getAlertBgColor(alert.type)} ${getAlertBorderColor(alert.type, alert.priority)}`}
              >
                <div className="flex items-start justify-between space-x-3">
                  <div className="flex items-start space-x-3 flex-1">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center space-x-2">
                        <Badge variant={getPriorityBadgeVariant(alert.priority)} className="text-xs">
                          {alert.priority.toUpperCase()}
                        </Badge>
                        {alert.actionRequired && (
                          <Badge variant="outline" className="text-xs">
                            Action Required
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm leading-relaxed">{alert.message}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => handleSnooze(alert.id)}
                        >
                          <Clock className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Snooze for 24 hours</p>
                      </TooltipContent>
                    </Tooltip>
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => handleDismiss(alert.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Dismiss alert</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>

                {alert.actionRequired && (
                  <div className="mt-3 pt-2 border-t border-current/20">
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" className="text-xs">
                        Take Action
                      </Button>
                      <Button size="sm" variant="ghost" className="text-xs">
                        Learn More
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Alert Summary */}
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {sortedAlerts.filter(a => a.priority === 'high').length} High Priority •{' '}
                  {sortedAlerts.filter(a => a.actionRequired).length} Action Required
                </span>
                <Button variant="ghost" size="sm" className="text-xs h-6">
                  <BellOff className="h-3 w-3 mr-1" />
                  Manage Notifications
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
