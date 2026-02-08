'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Aggressive caching for better navigation performance
        staleTime: 5 * 60 * 1000, // 5 minutes - data is considered fresh
        gcTime: 10 * 60 * 1000, // 10 minutes - cache garbage collection time (formerly cacheTime)
        refetchOnWindowFocus: false, // Don't refetch on window focus (reduces unnecessary requests)
        refetchOnMount: false, // Don't refetch on component mount if data is fresh
        retry: 1, // Only retry failed requests once
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
