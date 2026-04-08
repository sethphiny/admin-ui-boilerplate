import { apiClient } from '../../client'
import {
  ProviderStats,
  WebhookEvent,
  WebhookEventsFilter,
  PaginatedWebhookEventsResponse,
  RetryResponse,
  WebhookProvider,
} from '@/types/webhooks/webhooks'

export const webhooksApi = {
  /**
   * Get comprehensive statistics for a specific provider
   */
  getProviderStats: async (
    provider: WebhookProvider,
    startDate?: Date,
    endDate?: Date
  ): Promise<ProviderStats> => {
    const params: Record<string, string> = {}
    if (startDate) {
      params.startDate = startDate.toISOString()
    }
    if (endDate) {
      params.endDate = endDate.toISOString()
    }
    return apiClient.get<ProviderStats>(`/admin/webhooks/stats/${provider}`, { params })
  },

  /**
   * Get paginated list of webhook events with filtering
   */
  listWebhookEvents: async (
    filters?: WebhookEventsFilter
  ): Promise<PaginatedWebhookEventsResponse> => {
    return apiClient.get<PaginatedWebhookEventsResponse>('/admin/webhooks/events', { params: filters })
  },

  /**
   * Get list of failed webhooks for a specific provider
   */
  getFailedWebhooks: async (
    provider: WebhookProvider,
    limit: number = 50
  ): Promise<WebhookEvent[]> => {
    return apiClient.get<WebhookEvent[]>(`/admin/webhooks/failed/${provider}`, {
      params: { limit },
    })
  },

  /**
   * Manually retry a failed webhook event
   */
  retryWebhook: async (webhookId: string): Promise<RetryResponse> => {
    return apiClient.post<RetryResponse>(`/admin/webhooks/${webhookId}/retry`, {})
  },
}
