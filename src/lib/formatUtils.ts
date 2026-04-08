/**
 * Format amount with appropriate decimal places based on currency type
 * Crypto currencies typically use more decimal places than fiat
 */
export function formatAmount(amount: number, currency: string): string {
  const cryptoCurrencies = ['BTC', 'ETH', 'USDT', 'BNB', 'XRP', 'ADA', 'SOL']
  const isCrypto = cryptoCurrencies.includes(currency.toUpperCase())

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: isCrypto ? 2 : 2,
    maximumFractionDigits: isCrypto ? 8 : 2,
  }).format(amount)
}

/**
 * Format currency amount with symbol
 */
export function formatCurrencyAmount(amount: number, currency: string): string {
  return `${formatAmount(amount, currency)} ${currency}`
}

/**
 * Format currency with appropriate decimal places for crypto currencies
 * BTC: 8 decimals, ETH: 6 decimals, others: 2 decimals
 * Preserves precision from string values when possible
 */
export function formatCurrency(amount: number | string, currency: string): string {
  let numAmount: number
  let originalDecimals = 0
  
  if (typeof amount === 'string') {
    // Parse the string and count original decimal places
    numAmount = parseFloat(amount)
    if (isNaN(numAmount)) {
      return `0 ${currency}`
    }
    
    // Count decimal places in original string
    if (amount.includes('.')) {
      originalDecimals = amount.split('.')[1].length
    }
  } else {
    numAmount = amount
    if (isNaN(numAmount)) {
      return `0 ${currency}`
    }
  }

  // Determine max decimals based on currency
  let maxDecimals: number
  if (currency === 'BTC') {
    maxDecimals = 8
  } else if (currency === 'ETH') {
    maxDecimals = 6
  } else {
    maxDecimals = 2
  }

  // Use original precision if available and within max, otherwise use max
  const decimals = typeof amount === 'string' && originalDecimals > 0 
    ? Math.min(originalDecimals, maxDecimals) 
    : maxDecimals

  return `${numAmount.toFixed(decimals)} ${currency}`
}
