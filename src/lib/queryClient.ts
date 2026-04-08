import { QueryClient } from '@tanstack/react-query'
import { persistQueryClient } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'

// Create QueryClient with default options
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 0, // Default to 0 so queries can refetch when needed (individual queries can override)
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
  },
})

// Create localStorage persister
const localStoragePersister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'REACT_QUERY_OFFLINE_CACHE',
  serialize: JSON.stringify,
  deserialize: JSON.parse,
})

// Persist query client to localStorage
// Only persist specific queries (dashboard-stats) to avoid interfering with other queries
persistQueryClient({
  queryClient: queryClient as any, // Type assertion to handle version mismatch
  persister: localStoragePersister,
  maxAge: 10 * 60 * 1000, // 10 minutes - matches gcTime
  buster: '', // Cache buster - change this to invalidate all cached data
  dehydrateOptions: {
    shouldDehydrateQuery: (query) => {
      // Only persist dashboard-stats query to avoid interfering with other queries
      // Other queries will work normally without persistence
      return query.queryKey[0] === 'dashboard-stats'
    },
  },
})

