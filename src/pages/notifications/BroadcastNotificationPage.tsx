import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { PageHeader } from '@/components/layout/PageHeader'
import { NotificationForm } from '@/components/notifications/NotificationForm'
import { Button } from '@/components/ui/button'
import { notificationsApi } from '@/api/endpoints/notifications/notifications'
import { BroadcastNotificationRequest } from '@/types/notifications/notification.types'
import { NotificationFormData } from '@/components/notifications/NotificationForm'
import { showSuccessToast } from '@/lib/errorHandler'
import { HiOutlineArrowLeft, HiOutlineExclamationTriangle } from 'react-icons/hi2'

export default function BroadcastNotificationPage() {
  const navigate = useNavigate()
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [pendingData, setPendingData] = useState<NotificationFormData | null>(null)

  const handleSubmit = async (data: NotificationFormData) => {
    // Store the data and show confirmation dialog
    setPendingData(data)
    setShowConfirmDialog(true)
  }

  const handleConfirmBroadcast = async () => {
    if (!pendingData) return

    try {
      const request: BroadcastNotificationRequest = {
        title: pendingData.title,
        body: pendingData.body,
        channels: pendingData.channels,
      }

      const response = await notificationsApi.broadcastNotification(request)

      showSuccessToast(
        `Notification queued for ${response.totalUsers || 0} users. ${
          response.queuedCount || 0
        } notification jobs have been created.`
      )

      setShowConfirmDialog(false)
      setPendingData(null)
    } catch (error) {
      // Error is handled by the form component
      setShowConfirmDialog(false)
      throw error
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Broadcast Notification"
        description="Send push and email notifications to all active users on the platform"
        actions={
          <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="gap-2">
            <HiOutlineArrowLeft className="h-4 w-4" />
            Back
          </Button>
        }
      />

      <NotificationForm
        onSubmit={handleSubmit}
        title="Broadcast Notification"
        description="This notification will be sent to all active users. This action cannot be undone."
        submitLabel="Broadcast to All Users"
      />

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <HiOutlineExclamationTriangle className="h-5 w-5 text-destructive" />
              Confirm Broadcast
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to send this notification to <strong>ALL active users</strong>?
              <br />
              <br />
              This action cannot be undone. The notification will be sent via:{' '}
              <strong>{pendingData?.channels.join(' and ')}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingData(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmBroadcast} className="bg-destructive">
              Yes, Broadcast to All Users
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
