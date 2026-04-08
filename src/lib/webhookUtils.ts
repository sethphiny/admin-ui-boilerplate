/**
 * Format latency in milliseconds to a human-readable string
 * Converts large values to seconds, minutes, or hours as appropriate
 */
export function formatLatency(ms: number | null): string {
  if (ms === null || ms === undefined || isNaN(ms)) {
    return 'N/A'
  }

  // For very small values (< 1 second), show in milliseconds
  if (ms < 1000) {
    return `${Math.round(ms)}ms`
  }

  // For values < 1 minute, show in seconds with 1 decimal place
  if (ms < 60000) {
    const seconds = ms / 1000
    return `${seconds.toFixed(1)}s`
  }

  // For values < 1 hour, show in minutes with 1 decimal place
  if (ms < 3600000) {
    const minutes = ms / 60000
    return `${minutes.toFixed(1)}min`
  }

  // For values >= 1 hour, show in hours with 2 decimal places
  const hours = ms / 3600000
  return `${hours.toFixed(2)}h`
}

/**
 * Get latency color class based on value
 */
export function getLatencyColor(ms: number | null): string {
  if (ms === null || ms === undefined || isNaN(ms)) {
    return 'text-muted-foreground'
  }

  // < 1 second = green (excellent)
  if (ms < 1000) {
    return 'text-green-600 dark:text-green-400'
  }

  // < 5 seconds = yellow (acceptable)
  if (ms < 5000) {
    return 'text-yellow-600 dark:text-yellow-400'
  }

  // >= 5 seconds = red (needs attention)
  return 'text-red-600 dark:text-red-400'
}
