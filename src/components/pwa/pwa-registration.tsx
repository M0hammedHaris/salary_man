'use client';

import { useEffect } from 'react';
import { getPWANotificationManager } from '@/lib/pwa/notification-manager';

export function PWARegistration() {
  useEffect(() => {
    // Initialize PWA manager on client-side only
    const initializePWA = async () => {
      try {
        const pwaManager = getPWANotificationManager();
        await pwaManager.initialize();
        
        // Get status to verify initialization
        const status = pwaManager.getStatus();
        console.log('PWA initialization status:', status);
      } catch (error) {
        console.error('PWA initialization failed:', error);
      }
    };

    initializePWA();
    
    // Listen for PWA update events
    const handlePWAUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<{ updateAvailable: boolean }>;
      if (customEvent.detail.updateAvailable) {
        console.log('PWA update available');
        // You could show a toast or modal here to prompt user to update
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('pwa-update-available', handlePWAUpdate);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('pwa-update-available', handlePWAUpdate);
      }
    };
  }, []);

  return null;
}
