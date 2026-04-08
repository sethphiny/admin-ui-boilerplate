import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { WebhookEvent, WebhookStatus } from '@/types/webhooks/webhooks'
import {
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineArrowPath,
  HiOutlineClipboard,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineClock,
  HiOutlineArrowPathRoundedSquare,
  HiOutlineExclamationTriangle,
} from 'react-icons/hi2'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { webhooksApi } from '@/api/endpoints/webhooks/webhooks'
import { useToast } from '@/hooks/ui/use-toast'
import { cn } from '@/lib/utils'
import { formatDateTime, formatRelativeTime } from '@/lib/dateUtils'

interface WebhookDetailModalProps {
  webhook: WebhookEvent | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WebhookDetailModal({ webhook, open, onOpenChange }: WebhookDetailModalProps) {
  const [payloadExpanded, setPayloadExpanded] = useState(false)
  const [headersExpanded, setHeadersExpanded] = useState(false)
  const { toast } = useToast()
  const queryClient = useQueryClient()

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

  if (!webhook) return null

  const getStatusBadge = (status: WebhookStatus) => {
    const variants = {
      [WebhookStatus.PENDING]: { variant: 'secondary' as const, icon: HiOutlineClock },
      [WebhookStatus.PROCESSING]: { variant: 'default' as const, icon: HiOutlineArrowPathRoundedSquare },
      [WebhookStatus.COMPLETED]: { variant: 'default' as const, icon: HiOutlineCheckCircle },
      [WebhookStatus.FAILED]: { variant: 'destructive' as const, icon: HiOutlineXCircle },
      [WebhookStatus.ORPHANED]: { variant: 'secondary' as const, icon: HiOutlineExclamationTriangle },
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
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    )
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: 'Copied',
      description: `${label} copied to clipboard`,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Webhook Details</span>
            {getStatusBadge(webhook.status)}
          </DialogTitle>
          <DialogDescription>Webhook event ID: {webhook.id}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Provider</p>
              <p className="text-base font-semibold capitalize">{webhook.provider}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Idempotency Key</p>
              <div className="flex items-center gap-2">
                <p className="text-sm font-mono">{webhook.idempotencyKey}</p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => copyToClipboard(webhook.idempotencyKey, 'Idempotency key')}
                >
                  <HiOutlineClipboard className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Retry Count</p>
              <p className="text-base font-semibold">
                {webhook.retryCount} / {webhook.maxRetries}
              </p>
            </div>
            {webhook.processingLatencyMs !== null && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Processing Latency</p>
                <p className="text-base font-semibold">
                  {webhook.processingLatencyMs.toLocaleString()}ms
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Timestamps */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Created</p>
              <p className="text-sm">{formatDateTime(webhook.createdOn)}</p>
              <p className="text-xs text-muted-foreground">{formatRelativeTime(webhook.createdOn)}</p>
            </div>
            {webhook.processedAt && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Processed</p>
                <p className="text-sm">{formatDateTime(webhook.processedAt)}</p>
                <p className="text-xs text-muted-foreground">
                  {formatRelativeTime(webhook.processedAt)}
                </p>
              </div>
            )}
            {webhook.nextRetryAt && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Next Retry</p>
                <p className="text-sm">{formatDateTime(webhook.nextRetryAt)}</p>
                <p className="text-xs text-muted-foreground">
                  {formatRelativeTime(webhook.nextRetryAt)}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
              <p className="text-sm">{formatDateTime(webhook.updatedOn)}</p>
              <p className="text-xs text-muted-foreground">{formatRelativeTime(webhook.updatedOn)}</p>
            </div>
          </div>

          {/* Error Message */}
          {webhook.errorMessage && (
            <>
              <Separator />
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm font-medium text-destructive mb-1">Error Message</p>
                <p className="text-sm text-destructive/90">{webhook.errorMessage}</p>
              </div>
            </>
          )}

          {/* Payload */}
          <Separator />
          <Collapsible open={payloadExpanded} onOpenChange={setPayloadExpanded}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between">
                <span className="font-medium">Payload</span>
                {payloadExpanded ? (
                  <HiOutlineChevronUp className="h-4 w-4" />
                ) : (
                  <HiOutlineChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-2 p-4 rounded-lg bg-muted/50 border">
                <pre className="text-xs overflow-x-auto">
                  {JSON.stringify(webhook.payload, null, 2)}
                </pre>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={() =>
                    copyToClipboard(JSON.stringify(webhook.payload, null, 2), 'Payload')
                  }
                >
                  <HiOutlineClipboard className="h-3 w-3 mr-1" />
                  Copy
                </Button>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Headers */}
          {webhook.headers && (
            <>
              <Separator />
              <Collapsible open={headersExpanded} onOpenChange={setHeadersExpanded}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between">
                    <span className="font-medium">Headers</span>
                    {headersExpanded ? (
                      <HiOutlineChevronUp className="h-4 w-4" />
                    ) : (
                      <HiOutlineChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-2 p-4 rounded-lg bg-muted/50 border">
                    <pre className="text-xs overflow-x-auto">
                      {JSON.stringify(webhook.headers, null, 2)}
                    </pre>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2"
                      onClick={() =>
                        copyToClipboard(
                          JSON.stringify(webhook.headers, null, 2),
                          'Headers'
                        )
                      }
                    >
                      <HiOutlineClipboard className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </>
          )}

          {/* Actions */}
          {webhook.status === WebhookStatus.FAILED && (
            <>
              <Separator />
              <div className="flex justify-end">
                <Button
                  onClick={() => retryMutation.mutate(webhook.id)}
                  disabled={retryMutation.isPending}
                  className="gap-2"
                >
                  <HiOutlineArrowPath
                    className={cn('h-4 w-4', retryMutation.isPending && 'animate-spin')}
                  />
                  Retry Webhook
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
