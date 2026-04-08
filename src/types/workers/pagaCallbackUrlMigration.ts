export type BullJobState =
  | 'waiting'
  | 'active'
  | 'completed'
  | 'failed'
  | 'delayed'
  | 'paused'
  | 'stuck'

export interface PagaCallbackUrlMigrationTriggerRequest {
  dryRun?: boolean
  batchSize?: number
  sleepMs?: number
}

export interface PagaCallbackUrlMigrationTriggerResponse {
  jobId: string
  state: BullJobState
  alreadyEnqueued: boolean
}

export interface PagaCallbackUrlMigrationProgress {
  processed: number
  total: number
  updatedOk: number
  updatedFailed: number
}

export interface PagaCallbackUrlMigrationResult {
  webhookUrl: string
  dryRun: boolean
  batchSize: number
  sleepMs: number
  totalAccounts: number
  processed: number
  updatedOk: number
  updatedFailed: number
  startedAt: string
  finishedAt: string
}

export interface PagaCallbackUrlMigrationJobSnapshot {
  jobId: string
  name: string
  state: BullJobState
  progress: PagaCallbackUrlMigrationProgress | null
  attemptsMade: number
  timestamp: number
  processedOn: number | null
  finishedOn: number | null
  failedReason: string | null
  result: PagaCallbackUrlMigrationResult | null
}

