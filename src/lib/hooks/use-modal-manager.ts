import { useEffect, useCallback } from 'react';

/**
 * Global utility to force restore pointer events
 * Can be called from browser console if issues persist: window.restorePointerEvents()
 */
if (typeof window !== 'undefined') {
  (window as typeof window & { restorePointerEvents: () => void }).restorePointerEvents = () => {
    document.body.style.pointerEvents = '';
    document.body.removeAttribute('data-overlay-open');
    console.log('Pointer events restored manually');
  };
}

/**
 * Custom hook to manage modal state and prevent pointer-events issues
 */
export function useModalManager(isOpen: boolean) {
  // Cleanup function to restore pointer events
  const restorePointerEvents = useCallback(() => {
    // Use requestAnimationFrame to ensure DOM updates are complete
    requestAnimationFrame(() => {
      document.body.style.pointerEvents = '';
      document.body.removeAttribute('data-overlay-open');
    });
  }, []);

  // Set body attribute when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.setAttribute('data-overlay-open', 'true');
    } else {
      // Cleanup when modal closes
      const timer = setTimeout(restorePointerEvents, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, restorePointerEvents]);

  // Cleanup on component unmount
  useEffect(() => {
    return restorePointerEvents;
  }, [restorePointerEvents]);

  // Return cleanup function for manual use
  return { restorePointerEvents };
}
