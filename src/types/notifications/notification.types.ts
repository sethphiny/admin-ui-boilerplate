// Notification channel types
export type NotificationChannel = 'PUSH' | 'EMAIL'

// Form data for notification form
export interface NotificationFormData {
  title: string
  body: string
  channels: NotificationChannel[]
}

// Send notification to single user request
export interface SendNotificationRequest {
  userId: string
  title: string
  body: string
  channels: NotificationChannel[]
  data?: Record<string, any>
}

// Broadcast notification request
export interface BroadcastNotificationRequest {
  title: string
  body: string
  channels: NotificationChannel[]
  data?: Record<string, any>
}

// Notification response
export interface NotificationResponse {
  success: boolean
  message: string
  notificationId?: string
  totalUsers?: number
  queuedCount?: number
}
