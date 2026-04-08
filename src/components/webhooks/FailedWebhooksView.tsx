import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { webhooksApi } from '@/api/endpoints/webhooks/webhooks'
import { WebhookEvent, WebhookProvider } from '@/types/webhooks/webhooks'
import { WebhookDetailModal } from './WebhookDetailModal'
import {
  HiOutlineXCircle,
  HiOutlineArrowPath,
  HiOutlineEye,
} from 'react-icons/hi2'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/ui/use-toast'
import { cn } from '@/lib/utils'
import { EmptyState } from '@/components/misc/EmptyState'
import Loader from '@/components/misc/Loader'
import { formatDateTime, formatRelativeTime } from '@/lib/dateUtils'

export function FailedWebhooksView() {
  const [selectedProvider, setSelectedProvider] = useState<WebhookProvider>('paga')
  const [limit, setLimit] = useState(50)
  const [selectedWebhook, setSelectedWebhook] = useState<WebhookEvent | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedForRetry, setSelectedForRetry] = useState<Set<string>>(new Set())
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['failed-webhooks', selectedProvider, limit],
    queryFn: () => webhooksApi.getFailedWebhooks(selectedProvider, limit),
  })

  const retryMutation = useMutation({
    mutationFn: (id: string) => webhooksApi.retryWebhook(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhook-events'] })
      queryClient.invalidateQueries({ queryKey: ['webhook-stats'] })
      queryClient.invalidateQueries({ queryKey: ['failed-webhooks'] })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to retry webhook',
        variant: 'destructive',
      })
    },
  })

  const handleBulkRetry = async () => {
    if (selectedForRetry.size === 0) {
      toast({
        title: 'No selection',
        description: 'Please select webhooks to retry',
        variant: 'destructive',
      })
      return
    }

    const retryPromises = Array.from(selectedForRetry).map((id) =>
      retryMutation.mutateAsync(id)
    )

    try {
      await Promise.all(retryPromises)
      toast({
        title: 'Success',
        description: `${selectedForRetry.size} webhook(s) queued for reprocessing`,
      })
      setSelectedForRetry(new Set())
      refetch()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Some webhooks failed to retry',
        variant: 'destructive',
      })
    }
  }

  const toggleSelection = (id: string) => {
    setSelectedForRetry((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const selectAll = () => {
    if (data && data.length > 0) {
      setSelectedForRetry(new Set(data.map((w) => w.id)))
    }
  }

  const clearSelection = () => {
    setSelectedForRetry(new Set())
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <HiOutlineXCircle className="h-5 w-5 text-red-600" />
              Failed Webhooks
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="space-y-2">
                <Label htmlFor="provider-select">Provider</Label>
                <Select
                  value={selectedProvider}
                  onValueChange={(value) => {
                    setSelectedProvider(value as WebhookProvider)
                    setSelectedForRetry(new Set())
                  }}
                >
                  <SelectTrigger id="provider-select" className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paga">Paga</SelectItem>
                    <SelectItem value="thresh0ld">Thresh0ld</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="limit-select">Limit</Label>
                <Select
                  value={limit.toString()}
                  onValueChange={(value) => {
                    setLimit(parseInt(value))
                    setSelectedForRetry(new Set())
                  }}
                >
                  <SelectTrigger id="limit-select" className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" size="icon" onClick={() => refetch()} className="mt-6">
                <HiOutlineArrowPath className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && !data ? (
            <div className="flex items-center justify-center py-12">
              <Loader size="sm" />
            </div>
          ) : !data || data.length === 0 ? (
            <EmptyState
              title="No failed webhooks"
              description={`No failed webhooks found for ${selectedProvider}`}
            />
          ) : (
            <div className="space-y-4">
              {/* Bulk Actions */}
              {data.length > 0 && (
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {selectedForRetry.size} of {data.length} selected
                    </span>
                    <Button variant="ghost" size="sm" onClick={selectAll}>
                      Select All
                    </Button>
                    <Button variant="ghost" size="sm" onClick={clearSelection}>
                      Clear
                    </Button>
                  </div>
                  <Button
                    onClick={handleBulkRetry}
                    disabled={selectedForRetry.size === 0 || retryMutation.isPending}
                    className="gap-2"
                  >
                    <HiOutlineArrowPath
                      className={cn('h-4 w-4', retryMutation.isPending && 'animate-spin')}
                    />
                    Retry Selected ({selectedForRetry.size})
                  </Button>
                </div>
              )}

              {/* Failed Webhooks List */}
              <div className="space-y-2">
                {data.map((webhook) => (
                  <div
                    key={webhook.id}
                    className={cn(
                      'p-4 rounded-lg border transition-colors',
                      selectedForRetry.has(webhook.id)
                        ? 'bg-primary/5 border-primary'
                        : 'bg-card hover:bg-muted/50'
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <input
                          type="checkbox"
                          checked={selectedForRetry.has(webhook.id)}
                          onChange={() => toggleSelection(webhook.id)}
                          className="mt-1 h-4 w-4 rounded border-gray-300"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="destructive">Failed</Badge>
                            <span className="text-xs font-mono text-muted-foreground">
                              {webhook.id.substring(0, 8)}...
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatRelativeTime(webhook.createdOn)}
                            </span>
                          </div>
                          <p className="text-sm font-medium mb-1">
                            Idempotency: {webhook.idempotencyKey}
                          </p>
                          {webhook.errorMessage && (
                            <p className="text-sm text-destructive mb-2 line-clamp-2">
                              {webhook.errorMessage}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Retries: {webhook.retryCount}/{webhook.maxRetries}</span>
                            <span>Created: {formatDateTime(webhook.createdOn)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setSelectedWebhook(webhook)
                            setModalOpen(true)
                          }}
                        >
                          <HiOutlineEye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => retryMutation.mutate(webhook.id)}
                          disabled={retryMutation.isPending}
                        >
                          <HiOutlineArrowPath
                            className={cn('h-4 w-4', retryMutation.isPending && 'animate-spin')}
                          />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <WebhookDetailModal
        webhook={selectedWebhook}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </>
  )
}
