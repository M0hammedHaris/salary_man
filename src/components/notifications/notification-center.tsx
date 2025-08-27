'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell, Settings, Filter, Archive, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import type { NotificationCenterData } from '@/lib/services/notification-center-service';
import { NotificationPreferencesPanel } from './notification-preferences-panel';
import { BulkActionToolbar } from './bulk-action-toolbar';
import { useUser } from '@clerk/nextjs';

interface NotificationCenterProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function NotificationCenter({ isOpen = false, onClose }: NotificationCenterProps) {
  const { user } = useUser();
  const [data, setData] = useState<NotificationCenterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('all');
  const [showPreferences, setShowPreferences] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      
      const tabFilters: Record<string, string> = {};
      
      Object.entries({
        status: activeTab === 'all' ? 'all' : 
               activeTab === 'unread' ? 'triggered' : 
               activeTab === 'archived' ? undefined : 'all',
        includeArchived: activeTab === 'archived' ? 'true' : 'false',
        page: '1',
        limit: '50'
      }).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          tabFilters[key] = String(value);
        }
      });

      const response = await fetch('/api/notifications/center?' + new URLSearchParams(tabFilters));

      if (response.ok) {
        const notificationData = await response.json();
        setData(notificationData);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, activeTab]);

  useEffect(() => {
    if (user?.id && isOpen) {
      loadNotifications();
    }
  }, [user?.id, isOpen, activeTab, loadNotifications]);

  const handleNotificationAction = async (notificationId: string, action: string) => {
    if (!user?.id) return;

    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });

      if (response.ok) {
        await loadNotifications();
        setSelectedNotifications(new Set());
      }
    } catch (error) {
      console.error('Failed to update notification:', error);
    }
  };

  const handleBulkAction = async (action: string) => {
    if (!user?.id || selectedNotifications.size === 0) return;

    try {
      const response = await fetch('/api/notifications/bulk-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notificationIds: Array.from(selectedNotifications),
          action
        })
      });

      if (response.ok) {
        await loadNotifications();
        setSelectedNotifications(new Set());
      }
    } catch (error) {
      console.error('Failed to perform bulk action:', error);
    }
  };

  const toggleNotificationSelection = (notificationId: string) => {
    const newSelection = new Set(selectedNotifications);
    if (newSelection.has(notificationId)) {
      newSelection.delete(notificationId);
    } else {
      newSelection.add(notificationId);
    }
    setSelectedNotifications(newSelection);
  };

  const selectAllNotifications = () => {
    if (!data?.notifications) return;
    
    const allIds = new Set(data.notifications.map(n => n.id));
    setSelectedNotifications(allIds);
  };

  const clearSelection = () => {
    setSelectedNotifications(new Set());
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <DialogTitle>Notification Center</DialogTitle>
            {(data?.summary.unread ?? 0) > 0 && (
              <Badge variant="destructive" className="ml-2">
                {data?.summary.unread ?? 0}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreferences(true)}
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all" className="flex items-center gap-2">
              All
              {data?.summary.total && (
                <Badge variant="outline" className="ml-1">
                  {data.summary.total}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="unread" className="flex items-center gap-2">
              Unread
              {(data?.summary.unread ?? 0) > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {data?.summary.unread ?? 0}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="high" className="flex items-center gap-2">
              Priority
              {(data?.summary.high ?? 0) > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {data?.summary.high ?? 0}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="archived" className="flex items-center gap-2">
              Archived
              {(data?.summary.archived ?? 0) > 0 && (
                <Badge variant="outline" className="ml-1">
                  {data?.summary.archived ?? 0}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <div className="mt-4">
            {selectedNotifications.size > 0 && (
              <BulkActionToolbar
                selectedCount={selectedNotifications.size}
                onMarkAsRead={() => handleBulkAction('markAsRead')}
                onMarkAsUnread={() => handleBulkAction('markAsUnread')}
                onArchive={() => handleBulkAction('archive')}
                onDelete={() => handleBulkAction('delete')}
                onSelectAll={selectAllNotifications}
                onClearSelection={clearSelection}
              />
            )}

            <TabsContent value={activeTab} className="mt-4">
              <ScrollArea className="h-[400px] w-full">
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  </div>
                ) : data?.notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                    <Bell className="h-12 w-12 mb-2 opacity-50" />
                    <p>No notifications found</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {data?.notifications.map((notification) => (
                      <Card 
                        key={notification.id}
                        className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                          selectedNotifications.has(notification.id) ? 'ring-2 ring-primary' : ''
                        } ${!notification.readAt ? 'border-l-4 border-l-primary' : ''}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={selectedNotifications.has(notification.id)}
                              onCheckedChange={() => toggleNotificationSelection(notification.id)}
                              className="mt-1"
                            />
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <Badge variant={getPriorityColor(notification.priority || 'medium')}>
                                    {notification.priority || 'medium'}
                                  </Badge>
                                  <Badge variant="outline">
                                    {notification.alertType.replace(/_/g, ' ')}
                                  </Badge>
                                  {notification.accountName && (
                                    <Badge variant="secondary">
                                      {notification.accountName}
                                    </Badge>
                                  )}
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {formatRelativeTime(new Date(notification.triggeredAt))}
                                </span>
                              </div>
                              
                              <h4 className="font-medium leading-none mb-1">
                                {notification.alertType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {notification.message}
                              </p>
                              
                              <div className="flex items-center gap-2 mt-3">
                                {!notification.readAt && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleNotificationAction(notification.id, 'markAsRead')}
                                  >
                                    <CheckCheck className="h-3 w-3 mr-1" />
                                    Mark Read
                                  </Button>
                                )}
                                {notification.status === 'triggered' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleNotificationAction(notification.id, 'acknowledge')}
                                  >
                                    Acknowledge
                                  </Button>
                                )}
                                {!notification.archivedAt && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleNotificationAction(notification.id, 'archive')}
                                  >
                                    <Archive className="h-3 w-3 mr-1" />
                                    Archive
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </div>
        </Tabs>

        {/* Summary Stats */}
        {data && (
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Total: {data.summary.total}</span>
              <Separator orientation="vertical" className="h-4" />
              <span>Unread: {data.summary.unread}</span>
              <Separator orientation="vertical" className="h-4" />
              <span>High Priority: {data.summary.high}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab('history')}
            >
              View History
            </Button>
          </div>
        )}

        {/* Preferences Dialog */}
        <Dialog open={showPreferences} onOpenChange={setShowPreferences}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Notification Preferences</DialogTitle>
            </DialogHeader>
            <NotificationPreferencesPanel userId={user?.id || ''} />
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
