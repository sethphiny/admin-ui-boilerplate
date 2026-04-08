import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { DataTable, Column } from '@/components/tables/DataTable'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { workersApi } from '@/api/endpoints/workers/workers'
import { WorkerInfo } from '@/types/workers/workers'
import { WorkerStatusBadge } from '@/components/workers/WorkerStatusBadge'
import { WorkerHealthSummaryCard } from '@/components/workers/WorkerHealthSummaryCard'
import Loader from '@/components/misc/Loader'
import { PermissionError } from '@/components/misc/PermissionError'
import { isPermissionError, handleApiError } from '@/lib/errorHandler'
import { formatRelativeTime } from '@/lib/dateUtils'
import { HiOutlineArrowPath } from 'react-icons/hi2'

export default function WorkersPage() {
  const navigate = useNavigate()
  const [autoRefresh, setAutoRefresh] = useState(false)

  const { data: healthData, error: healthError, refetch: refetchHealth } = useQuery({
    queryKey: ['worker-health'],
    queryFn: () => workersApi.getWorkerHealth(),
    refetchInterval: autoRefresh ? 30000 : false,
  })

  const { data: workersData, isLoading: isLoadingWorkers, refetch: refetchWorkers, isFetching: isFetchingWorkers } = useQuery({
    queryKey: ['workers'],
    queryFn: () => workersApi.getAllWorkers(),
    refetchInterval: autoRefresh ? 10000 : false,
  })

  const columns: Column<WorkerInfo>[] = [
    {
      id: 'name',
      header: 'Name',
      accessorKey: 'name',
    },
    {
      id: 'type',
      header: 'Type',
      cell: (row) => (
        <Badge variant="outline" className="bg-gray-100 text-gray-800">
          {row.type}
        </Badge>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: (row) => <WorkerStatusBadge status={row.status.status} />,
    },
    {
      id: 'successRate',
      header: 'Success Rate',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-24 bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full"
              style={{ width: `${row.metrics.successRate}%` }}
            />
          </div>
          <span className="text-sm">{row.metrics.successRate.toFixed(1)}%</span>
        </div>
      ),
    },
    {
      id: 'lastExecution',
      header: 'Last Execution',
      cell: (row) => (
        <span className="text-sm text-muted-foreground">
          {row.status.lastExecution ? formatRelativeTime(row.status.lastExecution) : 'Never'}
        </span>
      ),
    },
    {
      id: 'queueName',
      header: 'Queue',
      cell: (row) => (
        <span className="text-sm text-muted-foreground">
          {row.queueName || '-'}
        </span>
      ),
    },
  ]

  if (isLoadingWorkers) {
    return <Loader fullScreen />
  }

  if (healthError && isPermissionError(healthError)) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Worker Monitoring"
          description="Monitor background workers and their performance"
        />
        <PermissionError message={handleApiError(healthError)} variant="inline" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Worker Monitoring"
        description="Monitor background workers and their performance"
      />

      {/* Health Summary */}
      {healthData && (
        <WorkerHealthSummaryCard health={healthData} />
      )}

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
            refetchWorkers()
            refetchHealth()
          }}
          variant="outline"
          disabled={isFetchingWorkers}
          className="gap-2"
        >
          <HiOutlineArrowPath
            className={`h-4 w-4 ${isFetchingWorkers ? 'animate-spin' : ''}`}
          />
          Refresh
        </Button>
      </div>

      {/* Workers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Workers</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={workersData || []}
            columns={columns}
            onRowClick={(row) => navigate(`/workers/${row.name}`)}
            refreshable={true}
            onRefresh={() => refetchWorkers()}
            isRefreshing={isFetchingWorkers}
            emptyStateTitle="No workers found"
            emptyStateDescription="There are no workers to display at this time."
          />
        </CardContent>
      </Card>
    </div>
  )
}
