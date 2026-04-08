import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { DataTable, Column } from '@/components/tables/DataTable'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { webhooksApi } from '@/api/endpoints/webhooks/webhooks'
import { WebhookEvent, WebhookStatus, WebhookEventsFilter, WebhookProvider } from '@/types/webhooks/webhooks'
import { WebhookDetailModal } from './WebhookDetailModal'
import {
  HiOutlineEye,
  HiOutlineArrowPath,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineClock,
  HiOutlineArrowPathRoundedSquare,
  HiOutlineExclamationTriangle,
} from 'react-icons/hi2'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/ui/use-toast'
import { cn } from '@/lib/utils'
import { formatDateTime, formatRelativeTime } from '@/lib/dateUtils'

interface WebhookEventsTableProps {
  initialFilters?: WebhookEventsFilter
}

export function WebhookEventsTable({ initialFilters }: WebhookEventsTableProps) {
  const [filters, setFilters] = useState<WebhookEventsFilter>({
    page: 1,
    limit: 20,
    ...initialFilters,
  })
  const [selectedWebhook, setSelectedWebhook] = useState<WebhookEvent | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data, isFetching, refetch } = useQuery({
    queryKey: ['webhook-events', filters],
    queryFn: () => webhooksApi.listWebhookEvents(filters),
  })

  const retryMutation = useMutation({
    mutationFn: (id: string) => webhooksApi.retryWebhook(id),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Webhook queued for reprocessing',
      })
      queryClient.invalidateQueries({ queryKey: ['webhook-events'] })
      queryClient.invalidateQueries({ queryKey: ['webhook-stats'] })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to retry webhook',
        variant: 'destructive',
      })
    },
  })

  const getStatusBadge = (status: WebhookStatus) => {
    const variants = {
      [WebhookStatus.PENDING]: {
        variant: 'secondary' as const,
        icon: HiOutlineClock,
        className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      },
      [WebhookStatus.PROCESSING]: {
        variant: 'default' as const,
        icon: HiOutlineArrowPathRoundedSquare,
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      },
      [WebhookStatus.COMPLETED]: {
        variant: 'default' as const,
        icon: HiOutlineCheckCircle,
        className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      },
      [WebhookStatus.FAILED]: {
        variant: 'destructive' as const,
        icon: HiOutlineXCircle,
        className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      },
      [WebhookStatus.ORPHANED]: {
        variant: 'secondary' as const,
        icon: HiOutlineExclamationTriangle,
        className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
      },
    }
    const config = variants[status]
    if (!config) {
      // Fallback for unknown statuses
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          {status}
        </Badge>
      )
    }
    const Icon = config.icon
    return (
      <Badge variant={config.variant} className={cn('flex items-center gap-1', config.className)}>
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    )
  }


  const columns: Column<WebhookEvent>[] = [
    {
      id: 'id',
      header: 'ID',
      cell: (row) => (
        <span className="font-mono text-xs">{row.id.substring(0, 8)}...</span>
      ),
    },
    {
      id: 'provider',
      header: 'Provider',
      cell: (row) => (
        <span className="capitalize font-medium">{row.provider}</span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: (row) => getStatusBadge(row.status),
    },
    {
      id: 'idempotencyKey',
      header: 'Idempotency Key',
      cell: (row) => (
        <span className="font-mono text-xs">{row.idempotencyKey}</span>
      ),
    },
    {
      id: 'createdOn',
      header: 'Created',
      cell: (row) => (
        <div>
          <p className="text-sm">{formatRelativeTime(row.createdOn)}</p>
          <p className="text-xs text-muted-foreground">{formatDateTime(row.createdOn)}</p>
        </div>
      ),
    },
    {
      id: 'processedAt',
      header: 'Processed',
      cell: (row) =>
        row.processedAt ? (
          <div>
            <p className="text-sm">{formatRelativeTime(row.processedAt)}</p>
            <p className="text-xs text-muted-foreground">{formatDateTime(row.processedAt)}</p>
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      id: 'latency',
      header: 'Latency',
      cell: (row) =>
        row.processingLatencyMs !== null ? (
          <span className="text-sm">{row.processingLatencyMs.toLocaleString()}ms</span>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      id: 'retryCount',
      header: 'Retries',
      cell: (row) => (
        <span className="text-sm">
          {row.retryCount}/{row.maxRetries}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation()
              setSelectedWebhook(row)
              setModalOpen(true)
            }}
          >
            <HiOutlineEye className="h-4 w-4" />
          </Button>
          {row.status === WebhookStatus.FAILED && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation()
                retryMutation.mutate(row.id)
              }}
              disabled={retryMutation.isPending}
            >
              <HiOutlineArrowPath
                className={cn('h-4 w-4', retryMutation.isPending && 'animate-spin')}
              />
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <>
      <div className="space-y-4">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="provider-filter">Provider</Label>
            <Select
              value={filters.provider || 'all'}
              onValueChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  provider: value === 'all' ? undefined : (value as WebhookProvider),
                  page: 1,
                }))
              }
            >
              <SelectTrigger id="provider-filter">
                <SelectValue placeholder="All Providers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Providers</SelectItem>
                <SelectItem value="paga">Paga</SelectItem>
                <SelectItem value="thresh0ld">Thresh0ld</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status-filter">Status</Label>
            <Select
              value={filters.status || 'all'}
              onValueChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  status: value === 'all' ? undefined : (value as WebhookStatus),
                  page: 1,
                }))
              }
            >
              <SelectTrigger id="status-filter">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value={WebhookStatus.PENDING}>Pending</SelectItem>
                <SelectItem value={WebhookStatus.PROCESSING}>Processing</SelectItem>
                <SelectItem value={WebhookStatus.COMPLETED}>Completed</SelectItem>
                <SelectItem value={WebhookStatus.FAILED}>Failed</SelectItem>
                <SelectItem value={WebhookStatus.ORPHANED}>Orphaned</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="start-date">Start Date</Label>
            <Input
              id="start-date"
              type="date"
              value={
                filters.startDate
                  ? new Date(filters.startDate).toISOString().split('T')[0]
                  : ''
              }
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  startDate: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                  page: 1,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end-date">End Date</Label>
            <Input
              id="end-date"
              type="date"
              value={
                filters.endDate
                  ? new Date(filters.endDate).toISOString().split('T')[0]
                  : ''
              }
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  endDate: e.target.value
                    ? new Date(e.target.value + 'T23:59:59').toISOString()
                    : undefined,
                  page: 1,
                }))
              }
            />
          </div>
        </div>

        {/* Table */}
        <DataTable
          data={data?.events || []}
          columns={columns}
          serverSidePagination={true}
          totalItems={data?.pagination.total || 0}
          currentPage={filters.page || 1}
          onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
          pageSize={filters.limit || 20}
          isLoading={isFetching}
          refreshable={true}
          onRefresh={() => refetch()}
          isRefreshing={isFetching}
          onRowClick={(row) => {
            setSelectedWebhook(row)
            setModalOpen(true)
          }}
          emptyStateTitle="No webhook events found"
          emptyStateDescription="Try adjusting your filters"
        />
      </div>

      {/* Detail Modal */}
      <WebhookDetailModal
        webhook={selectedWebhook}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </>
  )
}
