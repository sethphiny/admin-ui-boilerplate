import React from 'react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'
import { 
  HiOutlineEye,
  HiOutlineChevronDown,
  HiOutlineLink,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
} from 'react-icons/hi2'
import { cn } from '@/lib/utils'

interface MetadataDisplayProps {
  metadata: any
  level?: number
  className?: string
  onNavigate?: (path: string) => void
  parentKey?: string
}

const MAX_DEPTH = 5

/**
 * Formats a key from camelCase, snake_case, or kebab-case to Title Case
 */
function formatKey(key: string): string {
  let formatted = key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[-_]/g, ' ')
    .trim()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')

  return formatted
}

/**
 * Checks if a string is an ISO date string
 */
function isISODateString(value: string): boolean {
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
  return isoDateRegex.test(value)
}

/**
 * Formats a date string to a readable format
 */
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return dateString
    const locale = typeof navigator !== 'undefined' && navigator.language ? navigator.language : undefined
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateString
  }
}

/**
 * Checks if a key is a timestamp key (case-insensitive)
 */
function isTimestampKey(key: string): boolean {
  return key.toLowerCase() === 'timestamp' || key.toLowerCase() === 'timestamp_ms' || key.toLowerCase() === 'timestamp_s'
}

/**
 * Converts a timestamp value to a readable date/time format
 */
function formatTimestamp(value: any): string {
  try {
    let date: Date

    if (typeof value === 'number') {
      if (value < 10000000000) {
        date = new Date(value * 1000)
      } else {
        date = new Date(value)
      }
    } else if (typeof value === 'string') {
      const numValue = Number(value)
      if (!isNaN(numValue) && value.trim() !== '') {
        if (numValue < 10000000000) {
          date = new Date(numValue * 1000)
        } else {
          date = new Date(numValue)
        }
      } else {
        date = new Date(value)
      }
    } else {
      return String(value)
    }

    if (isNaN(date.getTime())) {
      return String(value)
    }

    const locale = typeof navigator !== 'undefined' && navigator.language ? navigator.language : undefined
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  } catch {
    return String(value)
  }
}

/**
 * Checks if a parent key matches transaction-related patterns
 */
function isTransactionParentKey(parentKey: string | undefined): boolean {
  if (!parentKey) return false
  const normalized = parentKey.toLowerCase().replace(/[-_\s]/g, '')
  return (
    normalized.includes('recenttransaction') ||
    normalized.includes('transaction') ||
    normalized === 'transactions'
  )
}

/**
 * Checks if a parent key matches balance log-related patterns
 */
function isBalanceLogParentKey(parentKey: string | undefined): boolean {
  if (!parentKey) return false
  const normalized = parentKey.toLowerCase().replace(/[-_\s]/g, '')
  return (
    normalized.includes('recentbalancelog') ||
    normalized.includes('balancelog') ||
    normalized === 'balancelogs' ||
    normalized === 'balancelog'
  )
}

/**
 * Gets a meaningful label for an array item (object or primitive)
 */
function getArrayItemLabel(item: any, index: number): string {
  if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
    const identifierFields = ['name', 'id', 'title', 'label', 'key', 'identifier', 'ref', 'reference']
    for (const field of identifierFields) {
      if (item[field] !== null && item[field] !== undefined && item[field] !== '') {
        return String(item[field])
      }
    }
  }
  return `Item ${index + 1}`
}

/**
 * Checks if a key is an ID field (case-insensitive)
 */
function isIdKey(key: string): boolean {
  const normalized = key.toLowerCase().replace(/[-_\s]/g, '')
  return normalized === 'id' || normalized.endsWith('id')
}

/**
 * Checks if a key is an explorer link field (case-insensitive)
 */
function isExplorerLinkKey(key: string): boolean {
  const normalized = key.toLowerCase().replace(/[-_\s]/g, '')
  return normalized.includes('explorerlink') || normalized.includes('explorer')
}

/**
 * Formats a value based on its type
 */
function formatValue(
  value: any,
  level: number = 0,
  onNavigate?: (path: string) => void,
  parentKey?: string,
  currentKey?: string
): React.ReactNode {
  if (value === null) {
    return <span className="text-muted-foreground italic">null</span>
  }

  if (value === undefined) {
    return <span className="text-muted-foreground italic">undefined</span>
  }

  if (typeof value === 'boolean') {
    return (
      <span className="inline-flex items-center gap-1.5">
        {value ? (
          <>
            <HiOutlineCheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-green-700 dark:text-green-400 font-medium">True</span>
          </>
        ) : (
          <>
            <HiOutlineXCircle className="h-4 w-4 text-red-600" />
            <span className="text-red-700 dark:text-red-400 font-medium">False</span>
          </>
        )}
      </span>
    )
  }

  if (typeof value === 'number') {
    if (currentKey && isIdKey(currentKey)) {
      return <span className="font-mono text-sm">{String(value)}</span>
    }
    return <span className="font-mono">{value.toLocaleString()}</span>
  }

  if (typeof value === 'string') {
    if (isISODateString(value)) {
      return <span>{formatDate(value)}</span>
    }
    if (currentKey && isExplorerLinkKey(currentKey) && (value.startsWith('http://') || value.startsWith('https://'))) {
      return (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-primary hover:underline font-mono text-sm"
        >
          <HiOutlineLink className="h-3.5 w-3.5" />
          {value}
        </a>
      )
    }
    if ((value.startsWith('http://') || value.startsWith('https://'))) {
      return (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-primary hover:underline break-all"
        >
          <HiOutlineLink className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{value}</span>
        </a>
      )
    }
    if (currentKey && isIdKey(currentKey) && /^\d+$/.test(value)) {
      return <span className="font-mono text-sm">{value}</span>
    }
    return <span>{value}</span>
  }

  if (Array.isArray(value)) {
    const filteredArray = value.filter(item => item !== null && item !== undefined)
    
    if (filteredArray.length === 0) {
      return <span className="text-muted-foreground italic text-sm">Empty array</span>
    }
    
    return (
      <div className="space-y-2">
        {filteredArray.map((item) => {
          const actualIndex = value.indexOf(item)
          const isItemObject = typeof item === 'object' && item !== null && !Array.isArray(item)
          const itemLabel = getArrayItemLabel(item, actualIndex)
          
          if (isItemObject) {
            const filteredObject = Object.entries(item).reduce((acc, [key, val]) => {
              if (val !== null && val !== undefined) {
                if (typeof val === 'object' && !Array.isArray(val)) {
                  const filtered = Object.entries(val).reduce((objAcc, [k, v]) => {
                    if (v !== null && v !== undefined) {
                      objAcc[k] = v
                    }
                    return objAcc
                  }, {} as Record<string, any>)
                  if (Object.keys(filtered).length > 0) {
                    acc[key] = filtered
                  }
                } else {
                  acc[key] = val
                }
              }
              return acc
            }, {} as Record<string, any>)
            
            if (Object.keys(filteredObject).length === 0) {
              return null
            }
            
            return (
              <Collapsible key={actualIndex} defaultOpen={false}>
                <div className="border rounded-md">
                  <CollapsibleTrigger className="w-full flex items-center justify-between px-3 py-2 hover:bg-muted/50 transition-colors text-left">
                    <span className="text-sm font-medium">{itemLabel}</span>
                    <HiOutlineChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 data-[state=open]:rotate-180" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-3 pb-3 border-t">
                      <MetadataDisplay
                        metadata={filteredObject}
                        level={level + 1}
                        onNavigate={onNavigate}
                        parentKey={parentKey}
                      />
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            )
          }
          
          return (
            <div key={actualIndex} className="text-sm pl-4 border-l-2 border-muted">
              <span className="text-muted-foreground font-medium">{itemLabel}:</span>{' '}
              {formatValue(item, level, onNavigate, parentKey, undefined)}
            </div>
          )
        })}
      </div>
    )
  }

  if (typeof value === 'object') {
    return null
  }

  return <span>{String(value)}</span>
}

export function MetadataDisplay({
  metadata,
  level = 0,
  className,
  onNavigate,
  parentKey,
}: MetadataDisplayProps) {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return null
  }

  const entries = Object.entries(metadata)

  if (entries.length === 0) {
    return (
      <div className={cn('text-sm text-muted-foreground italic py-4', className)}>
        No metadata available
      </div>
    )
  }

  if (level >= MAX_DEPTH) {
    return (
      <div className={cn('text-sm text-muted-foreground italic py-4', className)}>
        Maximum depth reached
      </div>
    )
  }

  const filterNullValues = (obj: any): any => {
    if (Array.isArray(obj)) {
      return obj.map(item => {
        if (typeof item === 'object' && item !== null) {
          return filterNullValues(item)
        }
        return item
      }).filter(item => item !== null)
    }
    if (typeof obj === 'object' && obj !== null) {
      const filtered: Record<string, any> = {}
      Object.entries(obj).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          if (typeof value === 'object' && !Array.isArray(value)) {
            const filteredValue = filterNullValues(value)
            if (Object.keys(filteredValue).length > 0) {
              filtered[key] = filteredValue
            }
          } else if (Array.isArray(value)) {
            const filteredArray = filterNullValues(value)
            if (filteredArray.length > 0) {
              filtered[key] = filteredArray
            }
          } else {
            filtered[key] = value
          }
        }
      })
      return filtered
    }
    return obj
  }

  const primitiveEntries: Array<[string, any]> = []
  const arrayEntries: Array<[string, any]> = []
  const objectEntries: Array<[string, any]> = []

  entries.forEach(([key, value]) => {
    if (value === null || value === undefined) {
      return
    }

    if (Array.isArray(value)) {
      const filteredArray = filterNullValues(value)
      if (filteredArray.length > 0) {
        arrayEntries.push([key, filteredArray])
      }
    } else if (typeof value === 'object' && value !== null) {
      const filteredObject = filterNullValues(value)
      if (Object.keys(filteredObject).length > 0) {
        objectEntries.push([key, filteredObject])
      }
    } else {
      primitiveEntries.push([key, value])
    }
  })

  const sortedEntries = [...primitiveEntries, ...arrayEntries, ...objectEntries]

  return (
    <dl className={cn('divide-y divide-border', className)}>
      {sortedEntries.map(([key, value]) => {
        const formattedKey = formatKey(key)
        const isObject = typeof value === 'object' && value !== null && !Array.isArray(value)
        const isArray = Array.isArray(value)

        if (isObject) {
          return (
            <div key={key} className="py-3 first:pt-0 last:pb-0">
              <Collapsible defaultOpen={level === 0}>
                <CollapsibleTrigger className="w-full flex items-center justify-between text-left py-2 hover:bg-muted/30 rounded-md px-2 -mx-2 transition-colors">
                  <dt className="text-sm font-semibold text-foreground">{formattedKey}</dt>
                  <HiOutlineChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 data-[state=open]:rotate-180 shrink-0" />
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3">
                  <div className="pl-4 border-l-2 border-border">
                    <MetadataDisplay
                      metadata={value}
                      level={level + 1}
                      onNavigate={onNavigate}
                      parentKey={key}
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          )
        }

        // Check navigation fields
        const isUserId = key.toLowerCase() === 'userid' || key.toLowerCase() === 'user_id'
        const isWalletId = key.toLowerCase() === 'walletid' || key.toLowerCase() === 'wallet_id'
        const normalizedKey = key.toLowerCase().replace(/[-_\s]/g, '')
        const isToWalletId = normalizedKey === 'towalletid' || normalizedKey === 'towallet'
        const isSourceTransactionId = 
          normalizedKey === 'sourcetransactionid' || 
          normalizedKey === 'sourcetransaction' ||
          normalizedKey === 'sourcetxid' ||
          normalizedKey === 'sourcetx'
        const isSwapInTransactionId = 
          normalizedKey === 'swapintransactionid' || 
          normalizedKey === 'swapintransaction' ||
          normalizedKey === 'swapintxid' ||
          normalizedKey === 'swapintx' ||
          normalizedKey === 'swapinid'
        const isSwapOutTransactionId = 
          normalizedKey === 'swapouttransactionid' || 
          normalizedKey === 'swapouttransaction' ||
          normalizedKey === 'swapouttxid' ||
          normalizedKey === 'swapouttx' ||
          normalizedKey === 'swapoutid'
        const isIdField = key.toLowerCase() === 'id'
        const isTransactionId = isIdField && isTransactionParentKey(parentKey)
        const isBalanceLogId = isIdField && isBalanceLogParentKey(parentKey)
        const isExplorerLink = isExplorerLinkKey(key) && typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://'))
        
        const shouldShowNavigation =
          ((isUserId || isWalletId || isToWalletId || isTransactionId || isBalanceLogId || isSourceTransactionId || isSwapInTransactionId || isSwapOutTransactionId) && onNavigate && value) ||
          false

        let navigationPath: string | null = null
        if (isUserId && onNavigate && value) {
          navigationPath = `/users/${value}`
        } else if ((isWalletId || isToWalletId) && onNavigate && value) {
          navigationPath = `/wallets/${value}`
        } else if ((isTransactionId || isSourceTransactionId || isSwapInTransactionId || isSwapOutTransactionId) && onNavigate && value) {
          navigationPath = `/transactions/${value}`
        } else if (isBalanceLogId && onNavigate && value) {
          navigationPath = `/balance-logs/${value}`
        }

        const displayValue = shouldShowNavigation ? (
          <span className="font-mono text-sm">{String(value)}</span>
        ) : isExplorerLink ? (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-primary hover:underline font-mono text-sm break-all"
          >
            <HiOutlineLink className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{value}</span>
          </a>
        ) : isTimestampKey(key) ? (
          <span>{formatTimestamp(value)}</span>
        ) : (
          formatValue(value, level, onNavigate, isArray ? key : parentKey, key)
        )

        return (
          <div key={key} className="py-3 first:pt-0 last:pb-0">
            <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-4 items-start">
              <dt className="text-sm font-medium text-muted-foreground">
                {formattedKey}
              </dt>
              <dd className="text-sm text-foreground flex items-center gap-2 min-w-0">
                <span className="flex-1 min-w-0 break-words">{displayValue}</span>
                {shouldShowNavigation && navigationPath && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 shrink-0 hover:bg-primary/10"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (onNavigate && navigationPath) {
                        onNavigate(navigationPath)
                      }
                    }}
                    title={
                      isUserId
                        ? 'View user details'
                        : (isWalletId || isToWalletId)
                          ? 'View wallet details'
                          : (isTransactionId || isSourceTransactionId || isSwapInTransactionId || isSwapOutTransactionId)
                            ? 'View transaction details'
                            : 'View balance log details'
                    }
                  >
                    <HiOutlineEye className="h-4 w-4" />
                  </Button>
                )}
              </dd>
            </div>
          </div>
        )
      })}
    </dl>
  )
}
