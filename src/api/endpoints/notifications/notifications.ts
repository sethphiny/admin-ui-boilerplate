import { apiClient } from '../../client'
import {
  SendNotificationRequest,
  BroadcastNotificationRequest,
  NotificationResponse,
} from '@/types/notifications/notification.types'

export const notificationsApi = {
  /**
   * Send notification to a single user
   * Requires: notification.send permission
   */
  sendNotification: async (data: SendNotificationRequest): Promise<NotificationResponse> => {
    return apiClient.post<NotificationResponse>('/admin/notifications/send', data)
  },

  /**
   * Broadcast notification to all active users
   * Requires: notification.broadcast permission
   */
  broadcastNotification: async (
    data: BroadcastNotificationRequest
  ): Promise<NotificationResponse> => {
    return apiClient.post<NotificationResponse>('/admin/notifications/broadcast', data)
  },
}
