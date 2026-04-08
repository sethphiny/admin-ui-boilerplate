import { Button } from '@/components/ui/button'
import {
  HiOutlineArrowPath,
  HiOutlineFunnel,
  HiOutlineExclamationCircle,
  HiOutlineInbox,
  HiOutlineMagnifyingGlass,
} from 'react-icons/hi2'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  title?: string
  description?: string
  icon?: React.ReactNode
  onRefresh?: () => void
  onClearFilters?: () => void
  hasFilters?: boolean
  variant?: 'default' | 'search' | 'inbox'
  className?: string
  action?: React.ReactNode
}

const defaultIcons = {
  default: HiOutlineExclamationCircle,
  search: HiOutlineMagnifyingGlass,
  inbox: HiOutlineInbox,
}

export function EmptyState({
  title = 'No data available',
  description = 'There are no items to display at this time.',
  icon,
  onRefresh,
  onClearFilters,
  hasFilters = false,
  variant = 'default',
  className,
  action,
}: EmptyStateProps) {
  const IconComponent = icon ? null : defaultIcons[variant]
  const hasActions = onRefresh || (hasFilters && onClearFilters) || action

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-16 px-4 animate-in fade-in slide-in-from-bottom-4 duration-300 ease-out',
        className
      )}
    >
      <div className="rounded-full bg-gradient-to-br from-muted to-muted/50 p-5 mb-6 shadow-sm animate-in zoom-in duration-300 ease-out transition-all">
        {icon ? (
          <div className="h-10 w-10 text-muted-foreground">{icon}</div>
        ) : IconComponent ? (
          <IconComponent className="h-10 w-10 text-muted-foreground" />
        ) : null}
      </div>
      <div className="space-y-3 mb-6">
        <h3 className="text-xl font-bold tracking-tight">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {hasActions && (
        <div className="flex gap-3 flex-wrap justify-center">
          {onRefresh && (
            <Button 
              onClick={onRefresh} 
              variant="outline" 
              size="sm"
              className="transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <HiOutlineArrowPath className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          )}
          {hasFilters && onClearFilters && (
            <Button 
              onClick={onClearFilters} 
              variant="outline" 
              size="sm"
              className="transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <HiOutlineFunnel className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          )}
          {action}
        </div>
      )}
    </div>
  )
}

