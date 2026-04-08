/**
 * Get the system locale, falling back to undefined (which uses browser default)
 */
function getSystemLocale(): string | undefined {
  if (typeof navigator !== 'undefined' && navigator.language) {
    return navigator.language
  }
  return undefined // Let browser use default
}

/**
 * Format a date string to localized date and time
 */
export function formatDateTime(
  dateString: string | number | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!dateString) {
    return 'N/A'
  }

  const date =
    typeof dateString === 'string' || typeof dateString === 'number'
      ? new Date(dateString)
      : dateString

  if (!date || isNaN(date.getTime())) {
    return 'Invalid Date'
  }

  return date.toLocaleString(getSystemLocale(), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  })
}

/**
 * Format a date string to localized date only
 */
export function formatDate(
  dateString: string | number | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!dateString) {
    return 'N/A'
  }

  const date =
    typeof dateString === 'string' || typeof dateString === 'number'
      ? new Date(dateString)
      : dateString

  if (!date || isNaN(date.getTime())) {
    return 'Invalid Date'
  }

  return date.toLocaleDateString(getSystemLocale(), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  })
}

/**
 * Format a date string to localized time only
 */
export function formatTime(
  dateString: string | number | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!dateString) {
    return 'N/A'
  }

  const date =
    typeof dateString === 'string' || typeof dateString === 'number'
      ? new Date(dateString)
      : dateString

  if (!date || isNaN(date.getTime())) {
    return 'Invalid Date'
  }

  return date.toLocaleTimeString(getSystemLocale(), {
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  })
}

/**
 * Format a date string to short date format (e.g., "Jan 15")
 */
export function formatDateShort(dateString: string | number | Date | null | undefined): string {
  return formatDate(dateString, {
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Format a date string to long date format
 */
export function formatDateLong(dateString: string | number | Date | null | undefined): string {
  return formatDate(dateString, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Format a date string as relative time (e.g., "2 hours ago", "3 days ago")
 */
export function formatRelativeTime(dateString: string | number | Date | null | undefined): string {
  if (!dateString) {
    return 'N/A'
  }

  const date =
    typeof dateString === 'string' || typeof dateString === 'number'
      ? new Date(dateString)
      : dateString

  if (!date || isNaN(date.getTime())) {
    return 'Invalid Date'
  }

  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`

  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`

  const diffWeeks = Math.floor(diffDays / 7)
  if (diffWeeks < 4) return `${diffWeeks}w ago`

  const diffMonths = Math.floor(diffDays / 30)
  if (diffMonths < 12) return `${diffMonths}mo ago`

  const diffYears = Math.floor(diffDays / 365)
  return `${diffYears}y ago`
}

/**
 * Format date for chart labels (short format for time series)
 */
export function formatDateForChart(
  date: Date,
  period: 'day' | 'week' | 'month' | 'year'
): string {
  const locale = getSystemLocale()

  switch (period) {
    case 'day':
      return date.toLocaleDateString(locale, { month: 'short', day: 'numeric' })
    case 'week':
      return `Week of ${date.toLocaleDateString(locale, { month: 'short', day: 'numeric' })}`
    case 'month':
      return date.toLocaleDateString(locale, { month: 'short', year: 'numeric' })
    case 'year':
      return date.toLocaleDateString(locale, { year: 'numeric' })
    default:
      return date.toLocaleDateString(locale, { month: 'short', day: 'numeric' })
  }
}
