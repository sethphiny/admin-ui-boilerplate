// Generic API response types
// Note: The API actually returns data directly (T), not wrapped in ApiResponse structure
// This type is kept for backward compatibility but the actual response is just T
export type ApiResponse<T = any> = T

// Paginated response structure - API returns data and meta directly
export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// API error response can be in two formats:
// 1. Legacy format: {success: false, message: string, ...}
// 2. New format: {statusCode: number, message: string}
export interface ApiError {
  // Legacy format fields
  success?: false
  // New format fields
  statusCode?: number
  // Common fields
  message: string
  timestamp?: string
  errors?: Record<string, string[]>
}

