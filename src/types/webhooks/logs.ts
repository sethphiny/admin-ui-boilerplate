export enum WebhookStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
}

export interface WebhookLog {
  id: string;
  sessionId: string;
  callbackUrl: string;
  payload: any;
  status: WebhookStatus;
  attempts: number;
  lastAttemptAt?: string;
  nextRetryAt?: string;
  lastResponse?: string;
  lastStatusCode?: number;
  createdOn: string;
}

export interface WebhookLogsResponse {
  data: WebhookLog[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
