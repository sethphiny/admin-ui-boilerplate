import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { webhooksApi } from '@/api/endpoints/webhooks/webhooks'
import { ProviderStats, WebhookProvider } from '@/types/webhooks/webhooks'
import {
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineClock,
  HiOutlineArrowPath,
  HiOutlineChartBar,
} from 'react-icons/hi2'
import { cn } from '@/lib/utils'
import Loader from '@/components/misc/Loader'
import { formatLatency, getLatencyColor } from '@/lib/webhookUtils'

interface WebhookProviderStatsProps {
  provider: WebhookProvider
  startDate?: Date
  endDate?: Date
  onDateRangeChange?: (startDate?: Date, endDate?: Date) => void
}

export function WebhookProviderStats({
  provider,
  startDate,
  endDate,
  onDateRangeChange,
}: WebhookProviderStatsProps) {
  const [localStartDate, setLocalStartDate] = useState<string>(
    startDate ? startDate.toISOString().split('T')[0] : ''
  )
  const [localEndDate, setLocalEndDate] = useState<string>(
    endDate ? endDate.toISOString().split('T')[0] : ''
  )

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['webhook-stats', provider, startDate, endDate],
    queryFn: () => {
      const start = startDate ? new Date(startDate) : undefined
      const end = endDate ? new Date(endDate) : undefined
      return webhooksApi.getProviderStats(provider, start, end)
    },
    refetchInterval: 30000, // Poll every 30 seconds
  })

  const handleDateChange = () => {
    const start = localStartDate ? new Date(localStartDate) : undefined
    const end = localEndDate ? new Date(localEndDate + 'T23:59:59') : undefined
    if (onDateRangeChange) {
      onDateRangeChange(start, end)
    }
  }

  const clearFilters = () => {
    setLocalStartDate('')
    setLocalEndDate('')
    if (onDateRangeChange) {
      onDateRangeChange(undefined, undefined)
    }
  }

  const stats: ProviderStats | null = data || null
  const successRate = stats?.successRate ?? 0
  const hasData = Boolean(stats && stats.totalReceived > 0)
  
  const getSuccessRateColor = (rate: number, hasData: boolean) => {
    if (!hasData) return 'text-muted-foreground'
    if (rate >= 95) return 'text-green-600 dark:text-green-400'
    if (rate >= 90) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getSuccessRateBadgeVariant = (rate: number, hasData: boolean): 'default' | 'secondary' | 'destructive' => {
    if (!hasData) return 'secondary'
    if (rate >= 95) return 'default'
    if (rate >= 90) return 'secondary'
    return 'destructive'
  }

  const getSuccessRateLabel = (rate: number, hasData: boolean) => {
    if (!hasData) return 'No Data'
    if (rate >= 95) return 'Excellent'
    if (rate >= 90) return 'Good'
    return 'Needs Attention'
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold capitalize">{provider} Statistics</CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => refetch()}
          className="h-8 w-8"
          disabled={isLoading}
        >
          <HiOutlineArrowPath className={cn('h-4 w-4', isLoading && 'animate-spin')} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Date Range Filter */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4 border-b">
          <div className="space-y-2">
            <Label htmlFor={`start-date-${provider}`}>Start Date</Label>
            <Input
              id={`start-date-${provider}`}
              type="date"
              value={localStartDate}
              onChange={(e) => setLocalStartDate(e.target.value)}
              onBlur={handleDateChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`end-date-${provider}`}>End Date</Label>
            <Input
              id={`end-date-${provider}`}
              type="date"
              value={localEndDate}
              onChange={(e) => setLocalEndDate(e.target.value)}
              onBlur={handleDateChange}
            />
          </div>
          <div className="space-y-2">
            <Label>&nbsp;</Label>
            <Button variant="outline" onClick={clearFilters} className="w-full">
              Clear Filters
            </Button>
          </div>
        </div>

        {isLoading && !stats ? (
          <div className="flex items-center justify-center py-8">
            <Loader size="sm" />
          </div>
        ) : stats ? (
          <div className="space-y-4">
            {/* Success Rate - Large Display */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <HiOutlineChartBar className="h-6 w-6 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                  <p className={cn('text-3xl font-bold', getSuccessRateColor(successRate, hasData))}>
                    {hasData ? `${successRate.toFixed(1)}%` : 'N/A'}
                  </p>
                </div>
              </div>
              <Badge variant={getSuccessRateBadgeVariant(successRate, hasData)} className="text-lg px-3 py-1">
                {getSuccessRateLabel(successRate, hasData)}
              </Badge>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Received</p>
                <p className="text-2xl font-semibold">{stats.totalReceived.toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <HiOutlineCheckCircle className="h-4 w-4 text-green-600" />
                  Completed
                </p>
                <p className="text-2xl font-semibold text-green-600">
                  {stats.completed.toLocaleString()}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <HiOutlineXCircle className="h-4 w-4 text-red-600" />
                  Failed
                </p>
                <p className="text-2xl font-semibold text-red-600">
                  {stats.failed.toLocaleString()}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <HiOutlineClock className="h-4 w-4 text-yellow-600" />
                  Pending
                </p>
                <p className="text-2xl font-semibold text-yellow-600">
                  {stats.pending.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Processing Status */}
            {stats.processing > 0 && (
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  {stats.processing} webhook{stats.processing !== 1 ? 's' : ''} currently processing
                </p>
              </div>
            )}

            {/* Latency Metrics */}
            {stats.avgLatencyMs !== null && (
              <div className="space-y-3 pt-3 border-t">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Latency Metrics</p>
                  <Badge variant="outline" className="text-xs">
                    Processing Time
                  </Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Average</p>
                    <p className={cn('text-lg font-semibold', getLatencyColor(stats.avgLatencyMs))}>
                      {formatLatency(stats.avgLatencyMs)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">P50 (Median)</p>
                    <p className={cn('text-lg font-semibold', getLatencyColor(stats.p50LatencyMs))}>
                      {formatLatency(stats.p50LatencyMs)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">P95</p>
                    <p className={cn('text-lg font-semibold', getLatencyColor(stats.p95LatencyMs))}>
                      {formatLatency(stats.p95LatencyMs)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">P99</p>
                    <p className={cn('text-lg font-semibold', getLatencyColor(stats.p99LatencyMs))}>
                      {formatLatency(stats.p99LatencyMs)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No statistics available
          </div>
        )}
      </CardContent>
    </Card>
  )
}
