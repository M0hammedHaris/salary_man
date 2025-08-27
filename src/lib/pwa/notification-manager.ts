/**
 * PWA Notification Manager
 * Handles PWA registration, push notifications, and cross-device synchronization
 */

export interface PWANotificationOptions {
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  alertType: string;
  accountId?: string;
  billId?: string;
  url?: string;
  data?: Record<string, unknown>;
}

export interface ServiceWorkerStatus {
  isSupported: boolean;
  isRegistered: boolean;
  isPushSupported: boolean;
  isNotificationPermissionGranted: boolean;
  registration?: ServiceWorkerRegistration;
}

export class PWANotificationManager {
  private static instance: PWANotificationManager;
  private registration: ServiceWorkerRegistration | null = null;
  private pushSubscription: PushSubscription | null = null;
  private offlineQueue: PWANotificationOptions[] = [];

  private constructor() {
    this.initializeServiceWorker();
    this.setupOnlineListener();
  }

  static getInstance(): PWANotificationManager {
    if (!PWANotificationManager.instance) {
      PWANotificationManager.instance = new PWANotificationManager();
    }
    return PWANotificationManager.instance;
  }

  /**
   * Initialize service worker and set up PWA functionality
   */
  private async initializeServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        console.log('PWA: Registering service worker...');
        this.registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });

        console.log('PWA: Service worker registered successfully');

        // Handle service worker updates
        this.registration.addEventListener('updatefound', () => {
          console.log('PWA: Service worker update found');
          const newWorker = this.registration?.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('PWA: New service worker available');
                this.notifyUpdateAvailable();
              }
            });
          }
        });

        // Set up push subscription if supported
        await this.setupPushSubscription();

      } catch (error) {
        console.error('PWA: Service worker registration failed:', error);
      }
    } else {
      console.warn('PWA: Service workers not supported');
    }
  }

  /**
   * Set up push notification subscription
   */
  private async setupPushSubscription(): Promise<void> {
    if (!this.registration || !('PushManager' in window)) {
      console.warn('PWA: Push notifications not supported');
      return;
    }

    try {
      // Check if we already have a subscription
      this.pushSubscription = await this.registration.pushManager.getSubscription();

      if (!this.pushSubscription && Notification.permission === 'granted') {
        // Create new subscription
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (vapidPublicKey) {
          this.pushSubscription = await this.registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: vapidPublicKey
          });

          // Send subscription to server
          await this.sendSubscriptionToServer(this.pushSubscription);
        }
      }
    } catch (error) {
      console.error('PWA: Failed to set up push subscription:', error);
    }
  }

  /**
   * Send push subscription to server
   */
  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription)
      });
      console.log('PWA: Push subscription sent to server');
    } catch (error) {
      console.error('PWA: Failed to send subscription to server:', error);
    }
  }

  /**
   * Request notification permission and set up push notifications
   */
  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('PWA: Notifications not supported');
      return false;
    }

    if (Notification.permission === 'granted') {
      await this.setupPushSubscription();
      return true;
    }

    if (Notification.permission === 'denied') {
      console.warn('PWA: Notification permission denied');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      
      if (granted) {
        await this.setupPushSubscription();
      }
      
      return granted;
    } catch (error) {
      console.error('PWA: Failed to request notification permission:', error);
      return false;
    }
  }

  /**
   * Send notification through PWA system
   */
  async sendNotification(options: PWANotificationOptions): Promise<boolean> {
    // If offline, queue the notification
    if (!navigator.onLine) {
      this.queueOfflineNotification(options);
      return false;
    }

    try {
      // Send to server for push delivery
      const response = await fetch('/api/notifications/pwa-send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...options,
          subscription: this.pushSubscription?.toJSON()
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log('PWA: Notification sent successfully');
      return true;
    } catch (error) {
      console.error('PWA: Failed to send notification:', error);
      this.queueOfflineNotification(options);
      return false;
    }
  }

  /**
   * Queue notification for offline delivery
   */
  private queueOfflineNotification(options: PWANotificationOptions): void {
    this.offlineQueue.push(options);
    console.log('PWA: Notification queued for offline delivery');
    
    // Store in localStorage as backup
    try {
      const existingQueue = JSON.parse(localStorage.getItem('pwa-notification-queue') || '[]');
      existingQueue.push({
        ...options,
        timestamp: Date.now()
      });
      localStorage.setItem('pwa-notification-queue', JSON.stringify(existingQueue));
    } catch (error) {
      console.error('PWA: Failed to store offline notification:', error);
    }
  }

  /**
   * Set up online event listener to sync offline notifications
   */
  private setupOnlineListener(): void {
    window.addEventListener('online', () => {
      console.log('PWA: Device came online, syncing notifications');
      this.syncOfflineNotifications();
    });
  }

  /**
   * Sync queued offline notifications when online
   */
  private async syncOfflineNotifications(): Promise<void> {
    // Sync memory queue
    const memoryQueue = [...this.offlineQueue];
    this.offlineQueue = [];

    // Sync localStorage queue
    let localStorageQueue: (PWANotificationOptions & { timestamp: number })[] = [];
    try {
      localStorageQueue = JSON.parse(localStorage.getItem('pwa-notification-queue') || '[]');
      localStorage.removeItem('pwa-notification-queue');
    } catch (error) {
      console.error('PWA: Failed to load offline notification queue:', error);
    }

    // Combine and sort by timestamp
    const allNotifications = [
      ...memoryQueue.map(n => ({ ...n, timestamp: Date.now() })),
      ...localStorageQueue
    ].sort((a, b) => a.timestamp - b.timestamp);

    // Send notifications in batches to avoid overwhelming the system
    const batchSize = 5;
    for (let i = 0; i < allNotifications.length; i += batchSize) {
      const batch = allNotifications.slice(i, i + batchSize);
      
      await Promise.allSettled(
        batch.map(notification => this.sendNotification(notification))
      );

      // Small delay between batches
      if (i + batchSize < allNotifications.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`PWA: Synced ${allNotifications.length} offline notifications`);
  }

  /**
   * Test notification delivery for all channels
   */
  async testNotification(): Promise<{ success: boolean; channels: Record<string, boolean> }> {
    const testOptions: PWANotificationOptions = {
      title: 'Test Notification',
      message: 'This is a test notification from Salary Man',
      priority: 'medium',
      alertType: 'test',
      url: '/dashboard/notifications'
    };

    const results = {
      success: false,
      channels: {
        pwa: false,
        serviceWorker: false,
        push: false
      }
    };

    try {
      // Test PWA notification sending
      results.channels.pwa = await this.sendNotification(testOptions);

      // Test service worker registration
      results.channels.serviceWorker = this.registration !== null;

      // Test push subscription
      results.channels.push = this.pushSubscription !== null;

      results.success = Object.values(results.channels).some(channel => channel);
    } catch (error) {
      console.error('PWA: Test notification failed:', error);
    }

    return results;
  }

  /**
   * Get current PWA and notification status
   */
  getStatus(): ServiceWorkerStatus {
    return {
      isSupported: 'serviceWorker' in navigator,
      isRegistered: this.registration !== null,
      isPushSupported: 'PushManager' in window && this.registration?.pushManager !== undefined,
      isNotificationPermissionGranted: Notification.permission === 'granted',
      registration: this.registration || undefined
    };
  }

  /**
   * Update service worker when new version is available
   */
  async updateServiceWorker(): Promise<void> {
    if (this.registration?.waiting) {
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      
      // Reload page to activate new service worker
      window.location.reload();
    }
  }

  /**
   * Notify user about available service worker update
   */
  private notifyUpdateAvailable(): void {
    // You can implement a UI notification here
    console.log('PWA: Service worker update available');
    
    // Optionally show toast notification
    if (window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('pwa-update-available', {
        detail: { updateAvailable: true }
      }));
    }
  }

  /**
   * Clear all notification data and reset PWA state
   */
  async reset(): Promise<void> {
    try {
      // Clear offline queue
      this.offlineQueue = [];
      localStorage.removeItem('pwa-notification-queue');

      // Unsubscribe from push notifications
      if (this.pushSubscription) {
        await this.pushSubscription.unsubscribe();
        this.pushSubscription = null;
      }

      // Unregister service worker
      if (this.registration) {
        await this.registration.unregister();
        this.registration = null;
      }

      console.log('PWA: Reset completed');
    } catch (error) {
      console.error('PWA: Reset failed:', error);
    }
  }

  /**
   * Get notification queue size for debugging
   */
  getQueueSize(): number {
    let localStorageQueueSize = 0;
    try {
      const localQueue = JSON.parse(localStorage.getItem('pwa-notification-queue') || '[]');
      localStorageQueueSize = localQueue.length;
    } catch {
      // Ignore parsing errors
    }
    
    return this.offlineQueue.length + localStorageQueueSize;
  }
}

// Export singleton instance
export const pwaNotificationManager = PWANotificationManager.getInstance();
