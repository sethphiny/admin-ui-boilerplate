/**
 * Get currency symbol for common currencies
 */
export function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    USDT: '₮',
    NGN: '₦',
    USD: '$',
    EUR: '€',
    GBP: '£',
    BTC: '₿',
    ETH: 'Ξ',
    BNB: 'BNB',
    XRP: 'XRP',
    ADA: 'ADA',
    SOL: 'SOL',
  }

  return symbols[currency.toUpperCase()] || currency.toUpperCase()
}

/**
 * Get currency color for common currencies (for badges/indicators)
 */
export function getCurrencyColor(currency: string): string {
  const colors: Record<string, string> = {
    USDT: '#26A17B',
    NGN: '#008751',
    USD: '#0D9488',
    EUR: '#3B82F6',
    GBP: '#8B5CF6',
    BTC: '#F7931A',
    ETH: '#627EEA',
  }

  return colors[currency.toUpperCase()] || '#6B7280'
}
