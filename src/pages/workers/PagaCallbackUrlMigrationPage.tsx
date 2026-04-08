import { useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import Loader from '@/components/misc/Loader'
import { PermissionError } from '@/components/misc/PermissionError'
import { isPermissionError, handleApiError } from '@/lib/errorHandler'
import { workersApi } from '@/api/endpoints/workers/workers'
import type { PagaCallbackUrlMigrationJobSnapshot } from '@/types/workers/pagaCallbackUrlMigration'
import { HiOutlineArrowPath } from 'react-icons/hi2'

function clampNumber(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function formatPercent(n: number): string {
  return `${Math.round(n)}%`
}

export default function PagaCallbackUrlMigrationPage() {
  const [dryRun, setDryRun] = useState(true)
  const [batchSize, setBatchSize] = useState(250)
  const [sleepMs, setSleepMs] = useState(50)
  const [jobId, setJobId] = useState<string | null>(null)

  const sanitized = useMemo(() => {
    return {
      dryRun,
      batchSize: clampNumber(Number.isFinite(batchSize) ? batchSize : 250, 1, 1000),
      sleepMs: clampNumber(Number.isFinite(sleepMs) ? sleepMs : 50, 0, 2000),
    }
  }, [dryRun, batchSize, sleepMs])

  const statusQuery = useQuery({
    queryKey: ['paga-callback-url-migration-status', jobId],
    queryFn: async (): Promise<PagaCallbackUrlMigrationJobSnapshot> => {
      if (jobId) return workersApi.getPagaCallbackUrlMigrationStatusByJobId(jobId)
      return workersApi.getPagaCallbackUrlMigrationStatus()
    },
    refetchInterval: (query) => {
      const data = query.state.data as PagaCallbackUrlMigrationJobSnapshot | undefined
      if (!data) return 3000
      return data.state === 'waiting' || data.state === 'active' ? 3000 : false
    },
    retry: false,
  })

  const triggerMutation = useMutation({
    mutationFn: async (forceDryRun: boolean) => {
      const res = await workersApi.triggerPagaCallbackUrlMigration({
        ...sanitized,
        dryRun: forceDryRun,
      })
      return res
    },
    onSuccess: async (res) => {
      setJobId(res.jobId)
      await statusQuery.refetch()
    },
  })

  const status = statusQuery.data
  const progress = status?.progress
  const result = status?.result

  const progressPct = useMemo(() => {
    if (!progress || !progress.total) return 0
    return (progress.processed / progress.total) * 100
  }, [progress])

  if (statusQuery.isLoading && !statusQuery.data) {
    return <Loader fullScreen />
  }

  if (statusQuery.error && isPermissionError(statusQuery.error)) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Paga Callback URL Migration"
          description="Trigger and monitor the migration that updates Paga callback URLs."
        />
        <PermissionError message={handleApiError(statusQuery.error)} variant="inline" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Paga Callback URL Migration"
        description="Trigger and monitor the migration that updates Paga callback URLs."
        actions={
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={() => statusQuery.refetch()}
            disabled={statusQuery.isFetching}
          >
            <HiOutlineArrowPath className={`h-4 w-4 ${statusQuery.isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Run Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <Switch id="dry-run" checked={dryRun} onCheckedChange={setDryRun} />
              <Label htmlFor="dry-run" className="cursor-pointer">
                Dry-run (don’t call Paga)
              </Label>
            </div>
            <div className="text-sm text-muted-foreground">
              Job: <span className="font-mono">{jobId || 'paga_migrate_callback_url_v1'}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="batchSize">Batch size (1–1000)</Label>
              <Input
                id="batchSize"
                type="number"
                inputMode="numeric"
                min={1}
                max={1000}
                value={batchSize}
                onChange={(e) => setBatchSize(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sleepMs">Sleep ms (0–2000)</Label>
              <Input
                id="sleepMs"
                type="number"
                inputMode="numeric"
                min={0}
                max={2000}
                value={sleepMs}
                onChange={(e) => setSleepMs(Number(e.target.value))}
              />
            </div>
          </div>

          {statusQuery.error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              {handleApiError(statusQuery.error)}
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              variant="secondary"
              onClick={(e) => {
                e.preventDefault()
                triggerMutation.mutate(true)
              }}
              disabled={triggerMutation.isPending}
              className="gap-2"
            >
              {triggerMutation.isPending ? (
                <HiOutlineArrowPath className="h-4 w-4 animate-spin" />
              ) : null}
              Run Dry-Run
            </Button>
            <Button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                triggerMutation.mutate(false)
              }}
              disabled={triggerMutation.isPending}
              className="gap-2"
            >
              {triggerMutation.isPending ? (
                <HiOutlineArrowPath className="h-4 w-4 animate-spin" />
              ) : null}
              Run Migration
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm">
              <span className="text-muted-foreground">State:</span>{' '}
              <span className="font-medium">{status?.state || 'unknown'}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Attempts: <span className="font-mono">{status?.attemptsMade ?? '-'}</span>
            </div>
          </div>

          {progress ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Processed {progress.processed} / {progress.total}
                </span>
                <span className="font-medium">{formatPercent(progressPct)}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-primary transition-all"
                  style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
                />
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                <div>
                  <div className="text-muted-foreground">Updated OK</div>
                  <div className="font-medium">{progress.updatedOk}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Updated Failed</div>
                  <div className="font-medium">{progress.updatedFailed}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Total</div>
                  <div className="font-medium">{progress.total}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Processed</div>
                  <div className="font-medium">{progress.processed}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              No progress available yet.
            </div>
          )}

          {status?.state === 'failed' && status.failedReason && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
              <div className="font-semibold text-destructive">Failed</div>
              <div className="mt-1 text-destructive">{status.failedReason}</div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Result</CardTitle>
        </CardHeader>
        <CardContent>
          {result ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <div className="text-sm text-muted-foreground">Webhook URL</div>
                <div className="break-all text-sm font-medium">{result.webhookUrl}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Dry-run</div>
                <div className="text-sm font-medium">{String(result.dryRun)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Batch size</div>
                <div className="text-sm font-medium">{result.batchSize}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Sleep ms</div>
                <div className="text-sm font-medium">{result.sleepMs}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total accounts</div>
                <div className="text-sm font-medium">{result.totalAccounts}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Updated OK</div>
                <div className="text-sm font-medium">{result.updatedOk}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Updated Failed</div>
                <div className="text-sm font-medium">{result.updatedFailed}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Started</div>
                <div className="text-sm font-medium">{result.startedAt}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Finished</div>
                <div className="text-sm font-medium">{result.finishedAt}</div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              Result is not available yet. While running, result is usually null.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

