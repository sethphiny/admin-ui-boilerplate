import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { workersApi } from '@/api/endpoints/workers/workers'
import { QueueHealthCard } from '@/components/workers/QueueHealthCard'
import Loader from '@/components/misc/Loader'
import { PermissionError } from '@/components/misc/PermissionError'
import { isPermissionError, handleApiError } from '@/lib/errorHandler'
import { HiOutlineArrowPath, HiOutlineQueueList } from 'react-icons/hi2'

export default function QueuesPage() {
  const [autoRefresh, setAutoRefresh] = useState(false)

  const { data: queuesData, isLoading: isLoadingQueues, error: queuesError, refetch: refetchQueues, isFetching: isFetchingQueues } = useQuery({
    queryKey: ['queues'],
    queryFn: () => workersApi.getAllQueues(),
    refetchInterval: autoRefresh ? 5000 : false,
  })

  if (isLoadingQueues) {
    return <Loader fullScreen />
  }

  if (queuesError && isPermissionError(queuesError)) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Queue Monitoring"
          description="Monitor Bull queue statistics and health"
        />
        <PermissionError message={handleApiError(queuesError)} variant="inline" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Queue Monitoring"
        description="Monitor Bull queue statistics and health"
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
          onClick={() => refetchQueues()}
          variant="outline"
          disabled={isFetchingQueues}
          className="gap-2"
        >
          <HiOutlineArrowPath
            className={`h-4 w-4 ${isFetchingQueues ? 'animate-spin' : ''}`}
          />
          Refresh
        </Button>
      </div>

      {/* Queues Grid */}
      {queuesData && queuesData.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {queuesData.map((queue) => (
            <QueueHealthCard key={queue.name} queue={queue} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <HiOutlineQueueList className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No queues found</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
