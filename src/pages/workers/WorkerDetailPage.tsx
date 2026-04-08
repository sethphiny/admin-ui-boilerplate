import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { workersApi } from '@/api/endpoints/workers/workers'
import { WorkerStatusBadge } from '@/components/workers/WorkerStatusBadge'
import { WorkerMetricsCard } from '@/components/workers/WorkerMetricsCard'
import { WorkerHistoryTable } from '@/components/workers/WorkerHistoryTable'
import Loader from '@/components/misc/Loader'
import { PermissionError } from '@/components/misc/PermissionError'
import { isPermissionError, handleApiError } from '@/lib/errorHandler'
import { formatDateTime } from '@/lib/dateUtils'
import { HiOutlineArrowLeft, HiOutlineArrowPath } from 'react-icons/hi2'

export default function WorkerDetailPage() {
  const { name } = useParams<{ name: string }>()
  const navigate = useNavigate()
  const [autoRefresh, setAutoRefresh] = useState(false)

  const { data: workerData, isLoading: isLoadingWorker, error: workerError, refetch: refetchWorker, isFetching: isFetchingWorker } = useQuery({
    queryKey: ['worker', name],
    queryFn: () => {
      if (!name) throw new Error('Worker name is required')
      return workersApi.getWorkerDetails(name)
    },
    enabled: !!name,
    refetchInterval: autoRefresh ? 5000 : false,
  })

  const { data: historyData, isLoading: isLoadingHistory, refetch: refetchHistory, isFetching: isFetchingHistory } = useQuery({
    queryKey: ['worker-history', name],
    queryFn: () => {
      if (!name) throw new Error('Worker name is required')
      return workersApi.getWorkerHistory(name, 50)
    },
    enabled: !!name,
    refetchInterval: autoRefresh ? 60000 : false,
  })

  if (!name) {
    return (
      <div className="space-y-6">
        <PageHeader title="Worker Not Found" />
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <p>Worker name is required</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoadingWorker) {
    return <Loader fullScreen />
  }

  if (workerError && isPermissionError(workerError)) {
    return (
      <div className="space-y-6">
        <PageHeader title="Worker Details" />
        <PermissionError message={handleApiError(workerError)} variant="inline" />
      </div>
    )
  }

  if (workerError || !workerData) {
    return (
      <div className="space-y-6">
        <PageHeader title="Worker Details" />
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <p>Worker not found or error loading worker data</p>
              <Button
                onClick={() => navigate('/workers')}
                variant="outline"
                className="mt-4 gap-2"
              >
                <HiOutlineArrowLeft className="h-4 w-4" />
                Back to Workers
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={workerData.name}
        description={`Monitor ${workerData.type} worker performance and execution history`}
        actions={
          <Button
            onClick={() => navigate('/workers')}
            variant="outline"
            className="gap-2"
          >
            <HiOutlineArrowLeft className="h-4 w-4" />
            Back
          </Button>
        }
      />

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              id="auto-refresh"
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
            />
            <Label htmlFor="auto-refresh" className="text-sm font-normal cursor-pointer">
              Auto-refresh
            </Label>
          </div>
        </div>
        <Button
          onClick={() => {
            refetchWorker()
            refetchHistory()
          }}
          variant="outline"
          disabled={isFetchingWorker || isFetchingHistory}
          className="gap-2"
        >
          <HiOutlineArrowPath
            className={`h-4 w-4 ${isFetchingWorker || isFetchingHistory ? 'animate-spin' : ''}`}
          />
          Refresh
        </Button>
      </div>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Current Status</p>
              <div className="mt-2">
                <WorkerStatusBadge status={workerData.status.status} />
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Execution</p>
              <p className="mt-2 text-lg font-semibold">
                {workerData.status.lastExecution
                  ? formatDateTime(workerData.status.lastExecution)
                  : 'Never'}
              </p>
            </div>
            {workerData.status.lastError && (
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">Last Error</p>
                <p className="mt-2 text-red-600">{workerData.status.lastError}</p>
              </div>
            )}
            {workerData.queueName && (
              <div>
                <p className="text-sm text-muted-foreground">Queue Name</p>
                <p className="mt-2 text-lg font-semibold">{workerData.queueName}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Metrics Card */}
      <WorkerMetricsCard metrics={workerData.metrics} />

      {/* History Card */}
      <Card>
        <CardHeader>
          <CardTitle>Execution History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingHistory ? (
            <div className="flex items-center justify-center py-12">
              <Loader size="sm" />
            </div>
          ) : (
            <WorkerHistoryTable history={historyData?.history || []} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
