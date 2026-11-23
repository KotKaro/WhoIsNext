import { QueryClient } from '@tanstack/react-query';

// A failed load or save shows its message at once; the next refresh is the retry.
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}
