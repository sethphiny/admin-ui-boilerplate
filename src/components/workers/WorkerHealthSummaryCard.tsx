import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { WorkerHealthSummary } from '@/types/workers/workers'
import { cn } from '@/lib/utils'

interface WorkerHealthSummaryCardProps {
  health: WorkerHealthSummary
}

export function WorkerHealthSummaryCard({ health }: WorkerHealthSummaryCardProps) {
  const getHealthColor = (overallHealth: string) => {
    switch (overallHealth) {
      case 'healthy':
        return 'text-green-600'
      case 'degraded':
        return 'text-yellow-600'
      case 'unhealthy':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Health Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Overall Health</p>
            <p className={cn('text-3xl font-bold', getHealthColor(health.overallHealth))}>
              {health.overallHealth.toUpperCase()}
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Workers</p>
              <p className="text-2xl font-bold">{health.totalWorkers}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Healthy</p>
              <p className="text-2xl font-bold text-green-600">{health.healthyWorkers}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Unhealthy</p>
              <p className="text-2xl font-bold text-red-600">{health.unhealthyWorkers}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Idle</p>
              <p className="text-2xl font-bold">{health.idleWorkers}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Running</p>
              <p className="text-2xl font-bold text-blue-600">{health.runningWorkers}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Errors</p>
              <p className="text-2xl font-bold text-red-600">{health.errorWorkers}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
