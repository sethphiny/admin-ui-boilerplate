import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { QueueInfo } from '@/types/workers/workers'
import { cn } from '@/lib/utils'

interface QueueHealthCardProps {
  queue: QueueInfo
  onClick?: () => void
}

export function QueueHealthCard({ queue, onClick }: QueueHealthCardProps) {
  const getQueueHealth = (stats: QueueInfo['statistics']): 'healthy' | 'warning' | 'critical' => {
    const failureRate = stats.completed > 0
      ? (stats.failed / (stats.completed + stats.failed)) * 100
      : 0

    if (stats.waiting > 100 || failureRate > 10) return 'critical'
    if (stats.waiting > 50 || failureRate > 5) return 'warning'
    return 'healthy'
  }

  const health = getQueueHealth(queue.statistics)

  const borderColorClass = {
    healthy: 'border-l-green-500',
    warning: 'border-l-yellow-500',
    critical: 'border-l-red-500',
  }[health]

  return (
    <Card
      className={cn('border-l-4', borderColorClass, onClick && 'cursor-pointer hover:shadow-lg transition-shadow')}
      onClick={onClick}
    >
      <CardHeader>
        <CardTitle className="text-lg">{queue.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Waiting</p>
            <p className="text-xl font-bold">{queue.statistics.waiting}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Active</p>
            <p className="text-xl font-bold">{queue.statistics.active}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Completed</p>
            <p className="text-xl font-bold text-green-600">
              {queue.statistics.completed.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Failed</p>
            <p className="text-xl font-bold text-red-600">
              {queue.statistics.failed.toLocaleString()}
            </p>
          </div>
          {queue.statistics.delayed > 0 && (
            <div className="col-span-2">
              <p className="text-sm text-muted-foreground">Delayed</p>
              <p className="text-xl font-bold text-yellow-600">
                {queue.statistics.delayed.toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
