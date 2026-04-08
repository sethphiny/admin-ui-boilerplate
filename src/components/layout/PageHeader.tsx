import { ReactNode } from 'react'
import { Breadcrumb, BreadcrumbItem as BreadcrumbItemType } from '@/components/layout/Breadcrumb'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string | ReactNode
  description?: string
  breadcrumbs?: BreadcrumbItemType[]
  actions?: ReactNode
  className?: string
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('space-y-4 animate-in fade-in slide-in-from-top-2 duration-300', className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumb items={breadcrumbs} />
      )}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 flex-1">
          {typeof title === 'string' ? (
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              {title}
            </h1>
          ) : (
            title
          )}
          {description && (
            <p className="text-muted-foreground text-base leading-relaxed">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}

