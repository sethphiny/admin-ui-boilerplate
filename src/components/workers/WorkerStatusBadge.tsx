import { Badge } from '@/components/ui/badge'
import { WorkerStatus } from '@/types/workers/workers'
import { cn } from '@/lib/utils'

interface WorkerStatusBadgeProps {
  status: WorkerStatus
  className?: string
}

export function WorkerStatusBadge({ status, className }: WorkerStatusBadgeProps) {
  const statusConfig = {
    [WorkerStatus.IDLE]: {
      label: 'IDLE',
      className: 'bg-blue-100 text-blue-800 border-blue-200',
    },
    [WorkerStatus.RUNNING]: {
      label: 'RUNNING',
      className: 'bg-green-100 text-green-800 border-green-200',
    },
    [WorkerStatus.ERROR]: {
      label: 'ERROR',
      className: 'bg-red-100 text-red-800 border-red-200',
    },
    [WorkerStatus.DISABLED]: {
      label: 'DISABLED',
      className: 'bg-gray-100 text-gray-800 border-gray-200',
    },
  }

  const config = statusConfig[status] || statusConfig[WorkerStatus.IDLE]

  return (
    <Badge
      variant="outline"
      className={cn(config.className, className, status === WorkerStatus.RUNNING && 'animate-pulse')}
    >
      {config.label}
    </Badge>
  )
}
