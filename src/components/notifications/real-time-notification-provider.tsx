'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';

export interface NotificationUpdate {
  type: 'new' | 'read' | 'dismissed' | 'updated';
  notificationId: string;
  data?: Record<string, unknown>;
}

interface RealTimeNotificationContextType {
  unreadCount: number;
  lastUpdate: Date | null;
  subscribe: (callback: (update: NotificationUpdate) => void) => () => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  refreshUnreadCount: () => Promise<void>;
}

const RealTimeNotificationContext = createContext<RealTimeNotificationContextType | undefined>(undefined);

export function useRealTimeNotifications() {
  const context = useContext(RealTimeNotificationContext);
  if (!context) {
    throw new Error('useRealTimeNotifications must be used within a RealTimeNotificationProvider');
  }
  return context;
}

interface RealTimeNotificationProviderProps {
  children: ReactNode;
}

export function RealTimeNotificationProvider({ children }: RealTimeNotificationProviderProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [subscribers, setSubscribers] = useState<Set<(update: NotificationUpdate) => void>>(new Set());

  // Fetch initial unread count
  const refreshUnreadCount = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/center?status=unread&limit=1');
      if (response.ok) {
        const data = await response.json();
        const newCount = data.total || 0;
        
        setUnreadCount(prevCount => {
          if (newCount !== prevCount) {
            setLastUpdate(new Date());
            
            // Notify subscribers of count change
            const update: NotificationUpdate = {
              type: 'updated',
              notificationId: 'count',
              data: { unreadCount: newCount }
            };
            
            subscribers.forEach(callback => {
              try {
                callback(update);
              } catch (error) {
                console.error('Error in notification subscriber:', error);
              }
            });
          }
          
          return newCount;
        });
      }
    } catch (error) {
      console.error('Failed to refresh unread count:', error);
    }
  }, [subscribers]);

  useEffect(() => {
    // Load cached count from localStorage immediately (non-blocking)
    const cachedCount = localStorage.getItem('notification-unread-count');
    if (cachedCount) {
      setUnreadCount(parseInt(cachedCount, 10) || 0);
    }

    // Fetch fresh count in background after a short delay (don't block initial render)
    const initialFetchTimeout = setTimeout(() => {
      refreshUnreadCount();
    }, 500);
    
    // Set up polling for real-time updates (increased to 60s to reduce load)
    const interval = setInterval(refreshUnreadCount, 60000); // Poll every 60 seconds
    
    return () => {
      clearTimeout(initialFetchTimeout);
      clearInterval(interval);
    };
  }, [refreshUnreadCount]);

  // Cache unread count to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('notification-unread-count', unreadCount.toString());
  }, [unreadCount]);

  const subscribe = (callback: (update: NotificationUpdate) => void) => {
    setSubscribers(prev => new Set([...prev, callback]));
    
    return () => {
      setSubscribers(prev => {
        const newSet = new Set(prev);
        newSet.delete(callback);
        return newSet;
      });
    };
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications/bulk-actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationIds: [notificationId],
          action: 'mark_read'
        })
      });

      if (response.ok) {
        // Update local count
        setUnreadCount(prev => Math.max(0, prev - 1));
        setLastUpdate(new Date());
        
        // Notify subscribers
        const update: NotificationUpdate = {
          type: 'read',
          notificationId
        };
        
        subscribers.forEach(callback => {
          try {
            callback(update);
          } catch (error) {
            console.error('Error in notification subscriber:', error);
          }
        });
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      // First get all unread notifications
      const response = await fetch('/api/notifications/center?status=unread');
      if (!response.ok) return;
      
      const data = await response.json();
      const notificationIds = data.notifications.map((n: { id: string }) => n.id);
      
      if (notificationIds.length === 0) return;

      // Mark all as read
      const markResponse = await fetch('/api/notifications/bulk-actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationIds,
          action: 'mark_read'
        })
      });

      if (markResponse.ok) {
        // Update local count to 0
        setUnreadCount(0);
        setLastUpdate(new Date());
        
        // Notify subscribers
        notificationIds.forEach((notificationId: string) => {
          const update: NotificationUpdate = {
            type: 'read',
            notificationId
          };
          
          subscribers.forEach(callback => {
            try {
              callback(update);
            } catch (error) {
              console.error('Error in notification subscriber:', error);
            }
          });
        });
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const contextValue: RealTimeNotificationContextType = {
    unreadCount,
    lastUpdate,
    subscribe,
    markAsRead,
    markAllAsRead,
    refreshUnreadCount
  };

  return (
    <RealTimeNotificationContext.Provider value={contextValue}>
      {children}
    </RealTimeNotificationContext.Provider>
  );
}
