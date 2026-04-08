import { Badge } from '@/components/ui/badge'
import { cn, formatTransactionType, getTransactionTypeColor } from '@/lib/utils'

interface TransactionTypeBadgeProps {
  type: string | null | undefined
  className?: string
}

/**
 * Reusable Badge component for displaying transaction types
 * Formats the type string and applies appropriate colors
 */
export function TransactionTypeBadge({ type, className }: TransactionTypeBadgeProps) {
  if (!type) {
    return <Badge className={cn('bg-gray-100 text-gray-800', className)}>-</Badge>
  }

  const formattedType = formatTransactionType(type)
  const colorClasses = getTransactionTypeColor(type)

  return (
    <Badge className={cn(colorClasses, className)}>
      {formattedType}
    </Badge>
  )
}

