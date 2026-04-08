import { apiClient } from '../../client'
import { PaginatedResponse } from '@/types/api/api'
import { ActivityLog, ActivityLogFilter } from '@/types/user/activity'

// API response structure - can be either format
interface ActivityLogApiResponse {
  data?: any[] // New format with data array
  results?: any[] // Old format with results array
  meta?: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
  // Old format - flat structure
  total?: number
  page?: number
  limit?: number
  totalPages?: number
}

// Transform a single log entry
const transformLogEntry = (log: any): ActivityLog => {
  // Handle resolverPath - may come as array or comma-separated string
  let resolverPath: string[] | null = null
  if (log.resolverPath) {
    if (Array.isArray(log.resolverPath)) {
      resolverPath = log.resolverPath
    } else if (typeof log.resolverPath === 'string') {
      resolverPath = log.resolverPath.split(',').map((p: string) => p.trim()).filter(Boolean)
    }
  }

  // Handle status - API returns "SUCCESS" or "FAILURE", we need lowercase
  let status: 'success' | 'error' = 'error'
  if (log.status) {
    const statusUpper = String(log.status).toUpperCase()
    status = statusUpper === 'SUCCESS' ? 'success' : 'error'
  }

  return {
    id: log.id,
    userId: log.userId || log.adminId, // Admin logs use adminId
    userEmail: log.userEmail || log.adminEmail, // Admin logs use adminEmail
    action: log.action,
    endpoint: log.endpoint,
    method: log.method,
    ipAddress: log.ipAddress,
    userAgent: log.userAgent,
    status: status,
    errorMessage: log.errorMessage,
    executionTime: log.executionTime,
    requestBody: log.requestBody,
    responseBody: log.responseBody,
    createdAt: log.createdOn || log.createdAt,
    // GraphQL-specific fields
    operationName: log.operationName || null,
    operationType: log.operationType || null,
    resolverPath: resolverPath,
    variables: log.variables || null,
    query: log.query || null,
    graphqlErrors: log.graphqlErrors || null,
  }
}

// Transform API response to match expected structure
const transformActivityLogResponse = (response: ActivityLogApiResponse): PaginatedResponse<ActivityLog> => {
  // Handle both response formats
  const logs = response.data || response.results || []
  const meta = response.meta || {
    total: response.total || 0,
    page: response.page || 1,
    limit: response.limit || 20,
    totalPages: response.totalPages || 0,
  }

  return {
    data: logs.map(transformLogEntry),
    meta: {
      total: meta.total,
      page: meta.page,
      limit: meta.limit,
      totalPages: meta.totalPages,
    },
  }
}

export const activityApi = {
  listActivityLogs: async (filters?: ActivityLogFilter): Promise<PaginatedResponse<ActivityLog>> => {
    const response = await apiClient.get<ActivityLogApiResponse>('/admin/activity-logs', {
      params: filters,
    })
    return transformActivityLogResponse(response)
  },

  listAdminActivityLogs: async (filters?: ActivityLogFilter): Promise<PaginatedResponse<ActivityLog>> => {
    const response = await apiClient.get<ActivityLogApiResponse>('/admin/activity-logs/admin', {
      params: filters,
    })
    return transformActivityLogResponse(response)
  },

  listGraphQLActivityLogs: async (filters?: ActivityLogFilter): Promise<PaginatedResponse<ActivityLog>> => {
    const response = await apiClient.get<ActivityLogApiResponse>('/admin/activity-logs/graphql', {
      params: filters,
    })
    return transformActivityLogResponse(response)
  },

  getActivityLogById: async (id: string): Promise<ActivityLog> => {
    const log = await apiClient.get<any>(`/admin/activity-logs/${id}`)
    return transformLogEntry(log)
  },

  getAdminActivityLogById: async (id: string): Promise<ActivityLog> => {
    const log = await apiClient.get<any>(`/admin/activity-logs/admin/${id}`)
    return transformLogEntry(log)
  },

  exportActivityLogsCSV: async (filters?: ActivityLogFilter): Promise<Blob> => {
    const response = await apiClient.get('/admin/activity-logs/export/csv', {
      params: filters,
      responseType: 'blob',
    } as any)
    return response as any
  },

  exportActivityLogsJSON: async (filters?: ActivityLogFilter): Promise<Blob> => {
    const response = await apiClient.get('/admin/activity-logs/export/json', {
      params: filters,
      responseType: 'blob',
    } as any)
    return response as any
  },
}

