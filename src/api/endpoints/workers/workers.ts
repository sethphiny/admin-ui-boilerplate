import { apiClient } from '../../client'
import {
  WorkerInfo,
  WorkerMetrics,
  WorkerHistoryResponse,
  QueueInfo,
  WorkerHealthSummary,
} from '@/types/workers/workers'
import type {
  PagaCallbackUrlMigrationJobSnapshot,
  PagaCallbackUrlMigrationTriggerRequest,
  PagaCallbackUrlMigrationTriggerResponse,
} from '@/types/workers/pagaCallbackUrlMigration'

export const workersApi = {
  /**
   * Get all workers with their current status and basic metrics
   */
  getAllWorkers: async (): Promise<WorkerInfo[]> => {
    return apiClient.get<WorkerInfo[]>('/admin/workers')
  },

  /**
   * Get detailed information for a specific worker
   */
  getWorkerDetails: async (name: string): Promise<WorkerInfo> => {
    return apiClient.get<WorkerInfo>(`/admin/workers/${name}`)
  },

  /**
   * Get performance metrics for a specific worker
   */
  getWorkerMetrics: async (name: string): Promise<WorkerMetrics> => {
    return apiClient.get<WorkerMetrics>(`/admin/workers/${name}/metrics`)
  },

  /**
   * Get execution history for a worker
   */
  getWorkerHistory: async (
    name: string,
    limit: number = 50
  ): Promise<WorkerHistoryResponse> => {
    return apiClient.get<WorkerHistoryResponse>(`/admin/workers/${name}/history`, {
      params: { limit },
    })
  },

  /**
   * Get all Bull queues with their statistics
   */
  getAllQueues: async (): Promise<QueueInfo[]> => {
    return apiClient.get<QueueInfo[]>('/admin/queues')
  },

  /**
   * Get detailed statistics for a specific queue
   */
  getQueueDetails: async (name: string): Promise<QueueInfo> => {
    return apiClient.get<QueueInfo>(`/admin/queues/${name}`)
  },

  /**
   * Get overall worker health summary for the system
   */
  getWorkerHealth: async (): Promise<WorkerHealthSummary> => {
    return apiClient.get<WorkerHealthSummary>('/admin/workers/health')
  },

  /**
   * Trigger the Paga callback URL migration worker.
   */
  triggerPagaCallbackUrlMigration: async (
    body: PagaCallbackUrlMigrationTriggerRequest = {}
  ): Promise<PagaCallbackUrlMigrationTriggerResponse> => {
    return apiClient.post<PagaCallbackUrlMigrationTriggerResponse>(
      '/admin/workers/paga/callback-url-migration',
      body
    )
  },

  /**
   * Fetch Paga callback URL migration status + results (default job).
   */
  getPagaCallbackUrlMigrationStatus: async (): Promise<PagaCallbackUrlMigrationJobSnapshot> => {
    return apiClient.get<PagaCallbackUrlMigrationJobSnapshot>(
      '/admin/workers/paga/callback-url-migration'
    )
  },

  /**
   * Fetch Paga callback URL migration status + results by jobId.
   */
  getPagaCallbackUrlMigrationStatusByJobId: async (
    jobId: string
  ): Promise<PagaCallbackUrlMigrationJobSnapshot> => {
    return apiClient.get<PagaCallbackUrlMigrationJobSnapshot>(
      `/admin/workers/paga/callback-url-migration/${jobId}`
    )
  },
}
