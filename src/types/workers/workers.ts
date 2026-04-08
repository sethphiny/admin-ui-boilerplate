// Worker Status Enum
export enum WorkerStatus {
  IDLE = 'IDLE',
  RUNNING = 'RUNNING',
  ERROR = 'ERROR',
  DISABLED = 'DISABLED',
}

// Worker Status Data
export interface WorkerStatusData {
  status: WorkerStatus
  lastExecution: string | null
  lastError: string | null
  instanceId: string
}

// Worker Metrics
export interface WorkerMetrics {
  totalExecutions: number
  successfulExecutions: number
  failedExecutions: number
  avgExecutionTime: number
  successRate: number
  lastExecutionTime: number | null
}

// Worker Info
export interface WorkerInfo {
  name: string
  status: WorkerStatusData
  metrics: WorkerMetrics
  type: 'cron' | 'queue'
  queueName: string | null
}

// Queue Statistics
export interface QueueStatistics {
  waiting: number
  active: number
  completed: number
  failed: number
  delayed: number
}

// Queue Info
export interface QueueInfo {
  name: string
  statistics: QueueStatistics
}

// Worker Execution History Entry
export interface WorkerExecutionHistory {
  timestamp: string
  status: 'success' | 'error'
  executionTime: number
  errorMessage: string | null
}

// Worker History Response
export interface WorkerHistoryResponse {
  worker: string
  history: WorkerExecutionHistory[]
}

// Worker Health Summary
export interface WorkerHealthSummary {
  totalWorkers: number
  healthyWorkers: number
  unhealthyWorkers: number
  idleWorkers: number
  runningWorkers: number
  errorWorkers: number
  overallHealth: 'healthy' | 'degraded' | 'unhealthy'
}
