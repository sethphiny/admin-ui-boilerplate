import { useQuery } from '@tanstack/react-query'
import { providerHealthApi } from '@/api/endpoints/providers/provider-health'
import {
  ProviderHealthResponse,
  AllProvidersHealthResponse,
  ProviderName,
} from '@/types/providers/provider-health.types'

const STALE_TIME = 30 * 1000 // 30 seconds

/**
 * Hook for fetching health data for all providers or a single provider
 */
export function useProviderHealth(provider?: ProviderName) {
  return useQuery<AllProvidersHealthResponse | ProviderHealthResponse>({
    queryKey: ['provider-health', provider],
    queryFn: async () => {
      if (provider) {
        return providerHealthApi.getProviderHealth(provider)
      }
      return providerHealthApi.getAllProvidersHealth()
    },
    staleTime: STALE_TIME,
    gcTime: 10 * 60 * 1000, // Keep cached data in memory for 10 minutes
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    placeholderData: (previousData: AllProvidersHealthResponse | ProviderHealthResponse | undefined) => previousData,
    structuralSharing: true,
  })
}

/**
 * Hook for fetching detailed metrics for a provider
 */
export function useProviderMetrics(provider: ProviderName) {
  return useQuery({
    queryKey: ['provider-metrics', provider],
    queryFn: () => providerHealthApi.getProviderMetrics(provider),
    enabled: !!provider,
    staleTime: STALE_TIME,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })
}

/**
 * Hook for fetching error logs for a provider
 */
export function useProviderErrors(provider: ProviderName, limit: number = 50) {
  return useQuery({
    queryKey: ['provider-errors', provider, limit],
    queryFn: () => providerHealthApi.getProviderErrors(provider, limit),
    enabled: !!provider,
    staleTime: 60 * 1000, // 1 minute for error logs
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })
}

/**
 * Hook for polling provider health with exponential backoff on errors
 */
export function useProviderHealthPolling(
  provider: ProviderName,
  interval: number = 30000 // 30 seconds
) {
  return useQuery({
    queryKey: ['provider-health-polling', provider],
    queryFn: () => providerHealthApi.getProviderHealth(provider),
    enabled: !!provider,
    refetchInterval: interval,
    refetchIntervalInBackground: true,
    staleTime: STALE_TIME,
    retry: (failureCount) => {
      // Exponential backoff: stop after 5 retries
      if (failureCount >= 5) return false
      return true
    },
    retryDelay: (attemptIndex) => {
      // Exponential backoff: 30s, 60s, 120s, 240s, 480s
      return Math.min(interval * Math.pow(2, attemptIndex), 480000)
    },
  })
}
