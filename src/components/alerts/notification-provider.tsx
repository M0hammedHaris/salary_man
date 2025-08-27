'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';

interface NotificationPreferences {
  email: boolean;
  push: boolean;
  inApp: boolean;
}

interface NotificationContextType {
  preferences: NotificationPreferences;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => Promise<void>;
  sendNotification: (notification: NotificationData) => Promise<void>;
  requestPushPermission: () => Promise<boolean>;
  isPushSupported: boolean;
  isPushPermissionGranted: boolean;
}

interface NotificationData {
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  accountName?: string;
  utilizationPercentage?: number;
  priority?: 'low' | 'medium' | 'high';
  channels?: ('email' | 'push' | 'inApp')[];
  // Bill reminder specific fields
  billId?: string;
  billName?: string;
  dueDate?: string;
  amount?: string;
  daysUntilDue?: number;
  notificationType?: 'credit_alert' | 'bill_reminder' | 'insufficient_funds' | 'payment_confirmation';
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email: true,
    push: false,
    inApp: true,
  });
  
  const [isPushSupported, setIsPushSupported] = useState(false);
  const [isPushPermissionGranted, setIsPushPermissionGranted] = useState(false);

  useEffect(() => {
    // Check if push notifications are supported
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsPushSupported(true);
      
      // Check current permission status
      if (Notification.permission === 'granted') {
        setIsPushPermissionGranted(true);
      }
    }

    // Load user preferences from local storage or API
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      // Try to load from API first
      const response = await fetch('/api/user/notification-preferences');
      if (response.ok) {
        const data = await response.json();
        setPreferences(data.preferences);
      } else {
        // Fallback to localStorage
        const saved = localStorage.getItem('notification-preferences');
        if (saved) {
          setPreferences(JSON.parse(saved));
        }
      }
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
      // Use localStorage as fallback
      const saved = localStorage.getItem('notification-preferences');
      if (saved) {
        setPreferences(JSON.parse(saved));
      }
    }
  };

  const updatePreferences = async (newPrefs: Partial<NotificationPreferences>) => {
    const updatedPrefs = { ...preferences, ...newPrefs };
    
    try {
      // Save to API
      const response = await fetch('/api/user/notification-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences: updatedPrefs }),
      });

      if (response.ok) {
        setPreferences(updatedPrefs);
      } else {
        throw new Error('Failed to save preferences to server');
      }
    } catch (error) {
      console.error('Failed to update preferences:', error);
      // Save to localStorage as fallback
      localStorage.setItem('notification-preferences', JSON.stringify(updatedPrefs));
      setPreferences(updatedPrefs);
    }
  };

  const requestPushPermission = async (): Promise<boolean> => {
    if (!isPushSupported) {
      console.warn('Push notifications are not supported');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      setIsPushPermissionGranted(granted);
      
      if (granted) {
        // Register service worker and get push subscription
        await registerPushSubscription();
      }
      
      return granted;
    } catch (error) {
      console.error('Failed to request push permission:', error);
      return false;
    }
  };

  const registerPushSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      });

      // Send subscription to server
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription),
      });
    } catch (error) {
      console.error('Failed to register push subscription:', error);
    }
  };

  const sendNotification = async (notification: NotificationData) => {
    const channels = notification.channels || ['inApp'];
    
    // Always show in-app notification if enabled
    if (channels.includes('inApp') && preferences.inApp) {
      showInAppNotification(notification);
    }

    // Send email notification if enabled
    if (channels.includes('email') && preferences.email) {
      await sendEmailNotification(notification);
    }

    // Send push notification if enabled and permission granted
    if (channels.includes('push') && preferences.push && isPushPermissionGranted) {
      await sendPushNotification(notification);
    }
  };

  const showInAppNotification = (notification: NotificationData) => {
    toast(notification.title, {
      description: notification.message,
      duration: notification.priority === 'high' ? 8000 : 5000,
      action: notification.type === 'warning' || notification.type === 'error' ? {
        label: 'View Details',
        onClick: () => {
          // Navigate to alerts page
          window.location.href = '/dashboard/alerts';
        },
      } : undefined,
      className: getToastClassName(notification.type),
    });
  };

  const sendEmailNotification = async (notification: NotificationData) => {
    try {
      const endpoint = notification.notificationType === 'bill_reminder' 
        ? '/api/notifications/bill-reminder-email'
        : '/api/notifications/email';
        
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: notification.title,
          message: notification.message,
          type: notification.type,
          accountName: notification.accountName,
          utilizationPercentage: notification.utilizationPercentage,
          // Bill reminder specific fields
          billId: notification.billId,
          billName: notification.billName,
          dueDate: notification.dueDate,
          amount: notification.amount,
          daysUntilDue: notification.daysUntilDue,
          notificationType: notification.notificationType,
        }),
      });
    } catch (error) {
      console.error('Failed to send email notification:', error);
    }
  };

  const sendPushNotification = async (notification: NotificationData) => {
    try {
      const endpoint = notification.notificationType === 'bill_reminder'
        ? '/api/notifications/bill-reminder-push'
        : '/api/notifications/push';
        
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: notification.title,
          message: notification.message,
          type: notification.type,
          icon: '/icons/notification-icon.png',
          badge: '/icons/badge-icon.png',
          tag: notification.notificationType === 'bill_reminder' 
            ? `bill-reminder-${notification.billId}`
            : `credit-alert-${notification.accountName}`,
          data: {
            url: notification.notificationType === 'bill_reminder' 
              ? '/bills' 
              : '/dashboard/alerts',
            accountName: notification.accountName,
            utilizationPercentage: notification.utilizationPercentage,
            billId: notification.billId,
            billName: notification.billName,
            dueDate: notification.dueDate,
            notificationType: notification.notificationType,
          },
        }),
      });
    } catch (error) {
      console.error('Failed to send push notification:', error);
    }
  };

  const getToastClassName = (type: NotificationData['type']) => {
    switch (type) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        preferences,
        updatePreferences,
        sendNotification,
        requestPushPermission,
        isPushSupported,
        isPushPermissionGranted,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export default NotificationProvider;
