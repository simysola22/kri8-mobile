import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 5 minutes stale time — reduces unnecessary refetches on mobile
      staleTime: 5 * 60 * 1000,
      // 30 minutes cache time — data stays in memory between navigations
      gcTime: 30 * 60 * 1000,
      // Retry twice on network error (offline queue handles the rest)
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
    },
    mutations: {
      // Mutations are handled by the offline queue — no automatic retries here
      retry: false,
    },
  },
});
