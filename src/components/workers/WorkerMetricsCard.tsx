import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { WorkerMetrics } from '@/types/workers/workers'

interface WorkerMetricsCardProps {
  metrics: WorkerMetrics
}

export function WorkerMetricsCard({ metrics }: WorkerMetricsCardProps) {
  const formatExecutionTime = (ms: number | null): string => {
    if (ms === null) return 'N/A'
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`
    return `${(ms / 60000).toFixed(2)}m`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Total Executions</p>
            <p className="text-2xl font-bold">{metrics.totalExecutions.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Success Rate</p>
            <p className="text-2xl font-bold text-green-600">
              {metrics.successRate.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Avg Execution Time</p>
            <p className="text-2xl font-bold">{formatExecutionTime(metrics.avgExecutionTime)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Successful</p>
            <p className="text-2xl font-bold text-green-600">
              {metrics.successfulExecutions.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Failed</p>
            <p className="text-2xl font-bold text-red-600">
              {metrics.failedExecutions.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Last Execution Time</p>
            <p className="text-2xl font-bold">
              {formatExecutionTime(metrics.lastExecutionTime)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
