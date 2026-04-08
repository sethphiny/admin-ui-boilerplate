import { ProviderHealthStatus, TimeWindow } from '@/types/providers/provider-health.types'

/**
 * Format timestamp as relative time (e.g., "5m ago", "2h ago")
 */
export function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}

/**
 * Get color class for health status
 */
export function getStatusColor(status: ProviderHealthStatus): string {
  const colors: Record<ProviderHealthStatus, string> = {
    HEALTHY: 'bg-green-100 text-green-800',
    DEGRADED: 'bg-yellow-100 text-yellow-800',
    DOWN: 'bg-red-100 text-red-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

/**
 * Get hex color for health status (for inline styles)
 */
export function getStatusColorHex(status: ProviderHealthStatus): string {
  const colors: Record<ProviderHealthStatus, string> = {
    HEALTHY: '#10b981',
    DEGRADED: '#f59e0b',
    DOWN: '#ef4444',
  }
  return colors[status] || '#6b7280'
}

/**
 * Get icon for health status
 */
export function getStatusIcon(status: ProviderHealthStatus): string {
  const icons: Record<ProviderHealthStatus, string> = {
    HEALTHY: '✓',
    DEGRADED: '⚠',
    DOWN: '✗',
  }
  return icons[status] || '?'
}

/**
 * Get label for health status
 */
export function getStatusLabel(status: ProviderHealthStatus): string {
  const labels: Record<ProviderHealthStatus, string> = {
    HEALTHY: 'Healthy',
    DEGRADED: 'Degraded',
    DOWN: 'Down',
  }
  return labels[status] || 'Unknown'
}

/**
 * Get color based on uptime percentage
 */
export function getUptimeColor(uptime: number): string {
  if (uptime >= 99) return '#10b981' // Green
  if (uptime >= 95) return '#f59e0b' // Amber/Orange
  return '#ef4444' // Red
}

/**
 * Get color class based on uptime percentage
 */
export function getUptimeColorClass(uptime: number): string {
  if (uptime >= 99) return 'text-green-600'
  if (uptime >= 95) return 'text-yellow-600'
  return 'text-red-600'
}

/**
 * Get status text based on uptime percentage
 */
export function getUptimeStatus(uptime: number): string {
  if (uptime >= 99) return 'Excellent'
  if (uptime >= 95) return 'Good'
  return 'Poor'
}

/**
 * Format latency value
 */
export function formatLatency(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

/**
 * Get color for HTTP status code
 */
export function getStatusCodeColor(statusCode: number): string {
  if (statusCode >= 500) return '#ef4444' // Red for 5xx
  if (statusCode >= 400) return '#f59e0b' // Yellow for 4xx
  return '#6b7280' // Gray for others
}

/**
 * Get color class for HTTP status code
 */
export function getStatusCodeColorClass(statusCode: number): string {
  if (statusCode >= 500) return 'bg-red-100 text-red-800'
  if (statusCode >= 400) return 'bg-yellow-100 text-yellow-800'
  return 'bg-gray-100 text-gray-800'
}

/**
 * Format time window label
 */
export function getTimeWindowLabel(window: TimeWindow): string {
  const labels: Record<TimeWindow, string> = {
    '5m': '5 Minutes',
    '1h': '1 Hour',
    '24h': '24 Hours',
    '30d': '30 Days',
  }
  return labels[window]
}

/**
 * Format provider name for display
 */
export function formatProviderName(provider: string): string {
  return provider
    .split(/(?=[A-Z])/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}
