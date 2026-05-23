'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { shouldUseAuthenticatedAppShell } from '@/lib/app-shell';
import { getPWANotificationManager } from '@/lib/pwa/notification-manager';

export function PWARegistration() {
  const pathname = usePathname();

  useEffect(() => {
    // Always initialize the service worker so installability, offline support,
    // and update checks work on both public and authenticated routes.
    const initializePWA = async () => {
      try {
        const pwaManager = getPWANotificationManager();
        await pwaManager.initialize();

        // Push subscription is user-specific, so defer it until the user is in
        // the authenticated app shell rather than on landing/auth routes.
        if (shouldUseAuthenticatedAppShell(pathname)) {
          await pwaManager.initializeAuthenticatedFeatures();
        }
        
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
  }, [pathname]);

  return null;
}
