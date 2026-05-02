import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { DataTable, Column } from '@/components/tables/DataTable'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/badge'
import { webhooksApi } from '@/api/endpoints/webhooks/webhooks'
import { WebhookLog, WebhookStatus } from '@/types/webhooks/logs'
import { TableSkeleton } from '@/components/ui/skeleton-loaders'
import { HiOutlineCodeBracket } from 'react-icons/hi2'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

export default function WebhookLogsPage() {
  const [page, setPage] = useState(1)
  const limit = 20

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['webhook-logs', page],
    queryFn: () => webhooksApi.listWebhookLogs(page, limit),
  })

  const getStatusBadge = (status: WebhookStatus) => {
    switch (status) {
      case WebhookStatus.SUCCESS:
        return <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">Success</Badge>
      case WebhookStatus.FAILED:
        return <Badge variant="destructive">Failed</Badge>
      case WebhookStatus.PENDING:
        return <Badge variant="secondary">Pending</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const columns: Column<WebhookLog>[] = [
    {
      id: 'sessionId',
      header: 'Session',
      cell: (row) => (
        <code className="text-xs font-mono">{row.sessionId.split('-')[0]}...</code>
      ),
    },
    {
      id: 'url',
      header: 'Endpoint',
      cell: (row) => (
        <div className="max-w-[200px] truncate text-xs text-muted-foreground" title={row.callbackUrl}>
          {row.callbackUrl}
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: (row) => getStatusBadge(row.status),
    },
    {
      id: 'attempts',
      header: 'Attempts',
      accessorKey: 'attempts',
    },
    {
      id: 'lastCode',
      header: 'Response',
      cell: (row) => (
        <Badge variant="outline" className={row.lastStatusCode === 200 ? 'text-green-600' : 'text-red-600'}>
          {row.lastStatusCode || 'N/A'}
        </Badge>
      ),
    },
    {
      id: 'createdOn',
      header: 'Timestamp',
      cell: (row) => new Date(row.createdOn).toLocaleString(),
    },
    {
      id: 'payload',
      header: 'Payload',
      cell: (row) => (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <HiOutlineCodeBracket className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Webhook Payload</DialogTitle>
            </DialogHeader>
            <div className="bg-muted p-4 rounded-md overflow-auto max-h-[400px]">
              <pre className="text-xs font-mono">
                {JSON.stringify(row.payload, null, 2)}
              </pre>
            </div>
            {row.lastResponse && (
              <div className="mt-4">
                <h4 className="text-sm font-semibold mb-2">Last Response</h4>
                <div className="bg-muted p-4 rounded-md overflow-auto max-h-[200px]">
                  <pre className="text-xs font-mono">{row.lastResponse}</pre>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      ),
    },
  ]

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Webhook Logs"
        description="History of all webhook delivery attempts to partners"
      />

      {isLoading && !data ? (
        <TableSkeleton />
      ) : (
        <DataTable
          data={data?.data || []}
          columns={columns}
          serverSidePagination={true}
          totalItems={data?.meta?.total || 0}
          currentPage={page}
          onPageChange={setPage}
          pageSize={limit}
          isLoading={isFetching}
          refreshable={true}
          onRefresh={() => refetch()}
          isRefreshing={isFetching}
          emptyStateTitle="No webhook logs found"
          emptyStateDescription="Webhook events will appear here once sessions are active."
        />
      )}
    </div>
  )
}
