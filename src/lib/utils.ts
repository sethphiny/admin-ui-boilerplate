import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a transaction type string by replacing underscores with spaces and converting to Title Case
 * @param type - Transaction type string (e.g., "BILL_PAYMENT", "SWAP_OUT")
 * @returns Formatted string (e.g., "Bill Payment", "Swap Out")
 */
export function formatTransactionType(type: string | null | undefined): string {
  if (!type) return ''
  
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Returns appropriate Tailwind CSS color classes for transaction type badges
 * @param type - Transaction type string
 * @returns Tailwind CSS classes for badge styling
 */
export function getTransactionTypeColor(type: string | null | undefined): string {
  if (!type) return 'bg-gray-100 text-gray-800'
  
  const typeUpper = type.toUpperCase()
  
  const typeColors: Record<string, string> = {
    DEPOSIT: 'bg-green-100 text-green-800',
    WITHDRAW: 'bg-red-100 text-red-800',
    BILL_PAYMENT: 'bg-blue-100 text-blue-800',
    SWAP_OUT: 'bg-purple-100 text-purple-800',
    SWAP_IN: 'bg-indigo-100 text-indigo-800',
    LOCK: 'bg-yellow-100 text-yellow-800',
    UNLOCK: 'bg-blue-100 text-blue-800',
    REPAIR: 'bg-orange-100 text-orange-800',
    DEBT_REPAYMENT: 'bg-pink-100 text-pink-800',
    TRANSFER: 'bg-cyan-100 text-cyan-800',
    REFUND: 'bg-amber-100 text-amber-800',
  }
  
  return typeColors[typeUpper] || 'bg-gray-100 text-gray-800'
}

