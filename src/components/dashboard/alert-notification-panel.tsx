"use client";

import { cn } from '@/lib/utils';
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

  const getAlertStyles = (type: string) => {
    switch (type) {
      case 'error': return 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-500/20';
      case 'warning': return 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/20';
      default: return 'bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-100 dark:border-sky-500/20';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error': return 'error';
      case 'warning': return 'warning';
      default: return 'info';
    }
  };

  const handleDismiss = (alertId: string) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]));
  };

  const visibleAlerts = alerts.filter(alert => !dismissedAlerts.has(alert.id));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          Alerts
        </h3>
        {visibleAlerts.length > 0 && (
          <span className="h-5 w-5 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold">
            {visibleAlerts.length}
          </span>
        )}
      </div>

      <div className="space-y-3">
        {visibleAlerts.length === 0 ? (
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-border p-8 text-center shadow-sm">
            <div className="h-16 w-16 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-emerald-500 text-[32px]">check_circle</span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">All Clear!</h4>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">No pending actions required.</p>
          </div>
        ) : (
          visibleAlerts.map((alert) => (
            <div
              key={alert.id}
              className={cn(
                "rounded-2xl p-4 border flex items-start gap-4 transition-all hover:translate-x-1 shadow-sm",
                getAlertStyles(alert.type)
              )}
            >
              <div className="mt-0.5">
                <span className="material-symbols-outlined text-[20px]">
                  {getAlertIcon(alert.type)}
                </span>
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-bold leading-tight line-clamp-2">
                  {alert.message}
                </p>
                {alert.actionRequired && (
                  <button className="text-[10px] font-bold uppercase tracking-wider underline underline-offset-4 decoration-2">
                    Solve Now
                  </button>
                )}
              </div>
              <button
                onClick={() => handleDismiss(alert.id)}
                className="opacity-40 hover:opacity-100 transition-opacity"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
