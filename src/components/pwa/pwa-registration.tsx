'use client';

import { useEffect } from 'react';
import { pwaNotificationManager } from '@/lib/pwa/notification-manager';

export function PWARegistration() {
  useEffect(() => {
    // Register PWA and service worker on mount
    pwaNotificationManager.getStatus();
    
    // Listen for PWA update events
    const handlePWAUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<{ updateAvailable: boolean }>;
      if (customEvent.detail.updateAvailable) {
        console.log('PWA update available');
        // You could show a toast or modal here to prompt user to update
      }
    };

    window.addEventListener('pwa-update-available', handlePWAUpdate);

    return () => {
      window.removeEventListener('pwa-update-available', handlePWAUpdate);
    };
  }, []);

  return null;
}
