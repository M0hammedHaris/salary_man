'use client';

/**
 * @file providers.tsx
 * @description Root provider tree for the application.
 *
 * Wraps all client-side infrastructure:
 * - TanStack Query (QueryClientProvider) — server-state caching layer
 * - next-themes (ThemeProvider) — dark/light/system theme management
 * - ReactQueryDevtools — development-only query inspector (never ships to production)
 *
 * Changes:
 * - ReactQueryDevtools is conditionally rendered only in NODE_ENV === 'development'
 *   to prevent the devtools bundle from being included in production builds.
 *   Previously the panel was hidden via `initialIsOpen={false}` but the bundle
 *   was still present; this fix eliminates it entirely at build time.
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider } from 'next-themes';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  // Initialise a stable QueryClient instance for the lifetime of the session.
  // Using useState with a factory function prevents re-creation on re-renders.
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Aggressive caching for better navigation performance:
        staleTime: 5 * 60 * 1000,      // 5 min  — treat cached data as fresh
        gcTime: 10 * 60 * 1000,         // 10 min — garbage-collect unused entries
        refetchOnWindowFocus: false,     // Avoid unnecessary refetches on tab switch
        refetchOnMount: false,           // Skip refetch when component mounts if data is fresh
        retry: 1,                        // Retry failed requests once before surfacing error
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {/*
        ThemeProvider — class-based strategy compatible with Tailwind dark mode.
        `disableTransitionOnChange` prevents a flash of unstyled content when
        switching themes by briefly disabling CSS transitions.
      */}
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {children}

        {/*
          ReactQueryDevtools — rendered ONLY in development.
          Excluded from production bundles entirely via the NODE_ENV check,
          which tree-shakes the import at build time.
        */}
        {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
      </ThemeProvider>
    </QueryClientProvider>
  );
}
