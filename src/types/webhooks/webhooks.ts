// Webhook Status Enum
export enum WebhookStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  ORPHANED = 'ORPHANED',
}

// Provider Statistics
export interface ProviderStats {
  provider: string
  totalReceived: number
  pending: number
  processing: number
  completed: number
  failed: number
  successRate: number
  avgLatencyMs: number | null
  p50LatencyMs: number | null
  p95LatencyMs: number | null
  p99LatencyMs: number | null
}

// Webhook Event
export interface WebhookEvent {
  id: string
  provider: string
  status: WebhookStatus
  payload: Record<string, any>
  headers: Record<string, any> | null
  idempotencyKey: string
  retryCount: number
  maxRetries: number
  nextRetryAt: string | null
  errorMessage: string | null
  processedAt: string | null
  processingLatencyMs: number | null
  createdOn: string
  updatedOn: string
}

// Webhook Events Filter
export interface WebhookEventsFilter {
  provider?: string
  status?: WebhookStatus
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
}

// Paginated Webhook Events Response
export interface PaginatedWebhookEventsResponse {
  events: WebhookEvent[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Retry Response
export interface RetryResponse {
  success: boolean
  message: string
  webhookId: string
}

// Provider name type
export type WebhookProvider = 'paga' | 'thresh0ld'
