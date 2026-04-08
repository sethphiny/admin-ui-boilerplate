/**
 * Utility functions for flight booking display
 */

function getSystemLocale(): string | undefined {
  if (typeof navigator !== 'undefined' && navigator.language) {
    return navigator.language
  }
  return undefined
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}h ${mins}m`
}

export function formatDateTime(dateString: string): { date: string; time: string } {
  const date = new Date(dateString)
  const locale = getSystemLocale()
  return {
    date: date.toLocaleDateString(locale, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }),
    time: date.toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }),
  }
}

export function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'reserved':
      return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400'
    case 'processing':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400'
    case 'booked':
    case 'confirmed':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400'
    case 'cancelled':
      return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400'
    case 'ticketed':
      return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400'
    default:
      return 'bg-muted text-muted-foreground'
  }
}

export function isDocumentExpiringSoon(expiryDate: string, travelDate: string): boolean {
  const expiry = new Date(expiryDate)
  const travel = new Date(travelDate)
  const sixMonthsFromTravel = new Date(travel)
  sixMonthsFromTravel.setMonth(sixMonthsFromTravel.getMonth() + 6)
  return expiry < sixMonthsFromTravel
}
