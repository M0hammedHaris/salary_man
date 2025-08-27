// Enhanced Service Worker for Salary Man PWA
// Handles push notifications, offline queuing, and notification synchronization

const CACHE_NAME = 'salary-man-v1';
const NOTIFICATION_CACHE = 'notifications-v1';
const OFFLINE_NOTIFICATION_STORE = 'offline-notifications';

// Cache resources for offline functionality
const CACHE_RESOURCES = [
  '/',
  '/dashboard',
  '/manifest.json',
  '/offline.html'
];

// Install service worker and cache resources
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching resources');
        return cache.addAll(CACHE_RESOURCES);
      })
      .then(() => {
        console.log('Service Worker: Cache setup complete');
        return self.skipWaiting();
      })
  );
});

// Activate service worker and clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== NOTIFICATION_CACHE) {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activation complete');
        return self.clients.claim();
      })
  );
});

// Handle push notification events
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push message received');
  
  if (!event.data) {
    console.log('Service Worker: No push data received');
    return;
  }

  try {
    const data = event.data.json();
    console.log('Service Worker: Push data:', data);

    const options = {
      body: data.message || data.body,
      icon: data.icon || '/icons/icon-192x192.png',
      badge: data.badge || '/icons/badge-icon.png',
      tag: data.tag || 'financial-alert',
      requireInteraction: data.priority === 'high' || data.priority === 'critical',
      silent: data.priority === 'low',
      timestamp: Date.now(),
      data: {
        url: data.url || '/dashboard/notifications',
        notificationId: data.notificationId,
        alertType: data.alertType,
        accountId: data.accountId,
        ...data.data
      },
      actions: getNotificationActions(data),
      ...getNotificationStyle(data)
    };

    event.waitUntil(
      Promise.all([
        self.registration.showNotification(data.title, options),
        storeNotificationOffline(data),
        syncNotificationStatus(data.notificationId, 'delivered')
      ])
    );
  } catch (error) {
    console.error('Service Worker: Error processing push notification:', error);
  }
});

// Handle notification click events
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked');
  event.notification.close();

  const { url, notificationId } = event.notification.data;
  
  // Handle notification actions
  if (event.action) {
    event.waitUntil(handleNotificationAction(event.action, event.notification.data));
    return;
  }

  // Open the app to the relevant page
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Try to focus existing window
        for (const client of clientList) {
          if (client.url.includes(url) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window if no existing window found
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
      .then(() => {
        // Mark notification as read
        return syncNotificationStatus(notificationId, 'read');
      })
  );
});

// Handle notification close events
self.addEventListener('notificationclose', (event) => {
  console.log('Service Worker: Notification closed');
  const { notificationId } = event.notification.data;
  
  event.waitUntil(
    syncNotificationStatus(notificationId, 'dismissed')
  );
});

// Handle background sync for offline notifications
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered');
  
  if (event.tag === 'notification-sync') {
    event.waitUntil(syncOfflineNotifications());
  }
});

// Enhanced notification actions based on alert type
function getNotificationActions(data) {
  const actions = [];
  
  switch (data.alertType || data.notificationType) {
    case 'credit_usage':
      actions.push(
        { action: 'view-account', title: 'View Account', icon: '/icons/account-icon.png' },
        { action: 'set-limit', title: 'Update Limit', icon: '/icons/settings-icon.png' }
      );
      break;
      
    case 'bill_reminder':
      actions.push(
        { action: 'pay-bill', title: 'Pay Now', icon: '/icons/pay-icon.png' },
        { action: 'view-bill', title: 'View Bill', icon: '/icons/bill-icon.png' }
      );
      break;
      
    case 'insufficient_funds':
      actions.push(
        { action: 'transfer-funds', title: 'Transfer', icon: '/icons/transfer-icon.png' },
        { action: 'view-balance', title: 'View Balance', icon: '/icons/balance-icon.png' }
      );
      break;
      
    default:
      actions.push(
        { action: 'view-details', title: 'View Details', icon: '/icons/details-icon.png' }
      );
  }
  
  // Always add dismiss action
  actions.push({ action: 'dismiss', title: 'Dismiss', icon: '/icons/dismiss-icon.png' });
  
  return actions.slice(0, 2); // Maximum 2 actions per notification
}

// Enhanced notification styling based on priority and type
function getNotificationStyle(data) {
  const style = {};
  
  // Priority-based styling
  switch (data.priority) {
    case 'critical':
      style.vibrate = [200, 100, 200, 100, 200];
      style.requireInteraction = true;
      break;
    case 'high':
      style.vibrate = [200, 100, 200];
      style.requireInteraction = true;
      break;
    case 'medium':
      style.vibrate = [100, 50, 100];
      break;
    case 'low':
      style.silent = true;
      break;
  }
  
  // Type-based customization
  switch (data.alertType || data.notificationType) {
    case 'credit_usage':
      style.icon = '/icons/credit-alert-icon.png';
      break;
    case 'bill_reminder':
      style.icon = '/icons/bill-reminder-icon.png';
      break;
    case 'insufficient_funds':
      style.icon = '/icons/warning-icon.png';
      style.vibrate = [300, 100, 300];
      break;
  }
  
  return style;
}

// Handle notification action clicks
async function handleNotificationAction(action, data) {
  console.log('Service Worker: Handling notification action:', action);
  
  try {
    switch (action) {
      case 'view-account':
        await clients.openWindow(`/accounts/${data.accountId}`);
        break;
        
      case 'view-bill':
        await clients.openWindow(`/bills/${data.billId}`);
        break;
        
      case 'pay-bill':
        await clients.openWindow(`/bills/${data.billId}/pay`);
        break;
        
      case 'transfer-funds':
        await clients.openWindow('/accounts/transfer');
        break;
        
      case 'view-balance':
        await clients.openWindow('/accounts');
        break;
        
      case 'set-limit':
        await clients.openWindow(`/accounts/${data.accountId}/settings`);
        break;
        
      case 'view-details':
        await clients.openWindow('/dashboard/notifications');
        break;
        
      case 'dismiss':
        await syncNotificationStatus(data.notificationId, 'dismissed');
        break;
        
      default:
        await clients.openWindow('/dashboard/notifications');
    }
    
    // Mark notification as interacted
    await syncNotificationStatus(data.notificationId, 'interacted');
  } catch (error) {
    console.error('Service Worker: Error handling notification action:', error);
  }
}

// Store notifications offline for sync when online
async function storeNotificationOffline(notificationData) {
  try {
    const cache = await caches.open(NOTIFICATION_CACHE);
    const offlineNotifications = await getOfflineNotifications();
    
    const notificationRecord = {
      id: notificationData.notificationId || generateNotificationId(),
      data: notificationData,
      timestamp: Date.now(),
      status: 'pending_sync'
    };
    
    offlineNotifications.push(notificationRecord);
    await cache.put(OFFLINE_NOTIFICATION_STORE, new Response(JSON.stringify(offlineNotifications)));
    
    console.log('Service Worker: Notification stored offline');
  } catch (error) {
    console.error('Service Worker: Error storing notification offline:', error);
  }
}

// Get offline notifications from cache
async function getOfflineNotifications() {
  try {
    const cache = await caches.open(NOTIFICATION_CACHE);
    const response = await cache.match(OFFLINE_NOTIFICATION_STORE);
    
    if (response) {
      return await response.json();
    }
    return [];
  } catch (error) {
    console.error('Service Worker: Error getting offline notifications:', error);
    return [];
  }
}

// Sync notification status with server
async function syncNotificationStatus(notificationId, status) {
  if (!notificationId) return;
  
  try {
    await fetch('/api/notifications/status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        notificationId,
        status,
        timestamp: Date.now()
      })
    });
    
    console.log(`Service Worker: Notification ${notificationId} status updated to ${status}`);
  } catch (error) {
    console.error('Service Worker: Error syncing notification status:', error);
    // Queue for background sync
    await self.registration.sync.register('notification-sync');
  }
}

// Sync offline notifications when online
async function syncOfflineNotifications() {
  try {
    const offlineNotifications = await getOfflineNotifications();
    const cache = await caches.open(NOTIFICATION_CACHE);
    
    for (const notification of offlineNotifications) {
      if (notification.status === 'pending_sync') {
        try {
          await syncNotificationStatus(notification.id, 'delivered');
          notification.status = 'synced';
        } catch {
          console.error('Service Worker: Error syncing notification:', notification.id);
        }
      }
    }
    
    // Update cache with synced notifications
    const syncedNotifications = offlineNotifications.filter(n => n.status === 'synced');
    await cache.put(OFFLINE_NOTIFICATION_STORE, new Response(JSON.stringify(syncedNotifications)));
    
    console.log('Service Worker: Offline notifications synced');
  } catch (error) {
    console.error('Service Worker: Error syncing offline notifications:', error);
  }
}

// Generate unique notification ID
function generateNotificationId() {
  return 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Handle fetch events for offline functionality
self.addEventListener('fetch', (event) => {
  // Only handle navigation requests and API calls
  if (event.request.mode === 'navigate' || event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // Return cached version or offline page
          if (event.request.mode === 'navigate') {
            return caches.match('/offline.html');
          }
          return caches.match(event.request);
        })
    );
  }
});

console.log('Service Worker: Enhanced PWA service worker loaded');
