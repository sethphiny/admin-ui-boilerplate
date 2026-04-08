import { useMemo } from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { formatDateTime } from '@/lib/dateUtils'

interface DataStatusIndicatorProps {
  isFetching: boolean
  dataUpdatedAt: number | undefined
  staleTime: number
  className?: string
}

export function DataStatusIndicator({
  isFetching,
  dataUpdatedAt,
  staleTime,
  className,
}: DataStatusIndicatorProps) {
  const status = useMemo(() => {
    if (!dataUpdatedAt) {
      return { color: 'bg-yellow-500', label: 'No data available' }
    }

    const timeSinceUpdate = Date.now() - dataUpdatedAt

    if (isFetching) {
      return { color: 'bg-blue-500', label: 'Updating...' }
    }

    // Consider data "healthy/fresh" for a longer visual period 
    if (timeSinceUpdate < staleTime * 5) {
      return { color: 'bg-emerald-500', label: 'Data is up to date' }
    }

    return { color: 'bg-amber-500', label: 'Data might be delayed' }
  }, [isFetching, dataUpdatedAt, staleTime])

  const lastUpdateText = useMemo(() => {
    if (!dataUpdatedAt) return 'Never'

    const secondsAgo = Math.floor((Date.now() - dataUpdatedAt) / 1000)
    if (secondsAgo < 60) {
      return `${secondsAgo} second${secondsAgo !== 1 ? 's' : ''} ago`
    }

    const minutesAgo = Math.floor(secondsAgo / 60)
    if (minutesAgo < 60) {
      return `${minutesAgo} minute${minutesAgo !== 1 ? 's' : ''} ago`
    }

    const hoursAgo = Math.floor(minutesAgo / 60)
    return `${hoursAgo} hour${hoursAgo !== 1 ? 's' : ''} ago`
  }, [dataUpdatedAt])

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn('flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors duration-200 cursor-help', className)}>
            <div
              className={cn(
                'h-2.5 w-2.5 rounded-full transition-all duration-300 ring-2 ring-background',
                status.color
              )}
              style={
                isFetching
                  ? {
                    animation: 'breathing 2s ease-in-out infinite',
                  }
                  : undefined
              }
              aria-label={status.label}
            />
            <span className="text-xs font-medium text-muted-foreground hidden sm:inline">
              Updated {lastUpdateText}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent className="shadow-lg">
          <div className="space-y-1.5">
            <p className="font-semibold text-sm">{status.label}</p>
            <p className="text-xs text-muted-foreground">
              Last updated: {dataUpdatedAt ? formatDateTime(dataUpdatedAt) : 'Never'}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

