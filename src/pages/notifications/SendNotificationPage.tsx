import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { NotificationForm } from '@/components/notifications/NotificationForm'
import { Card, CardContent } from '@/components/ui/card'
import { Combobox } from '@/components/ui/combobox'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { notificationsApi } from '@/api/endpoints/notifications/notifications'
import { usersApi } from '@/api/endpoints/users/users'
import { SendNotificationRequest } from '@/types/notifications/notification.types'
import { NotificationFormData } from '@/components/notifications/NotificationForm'
import { User } from '@/types/user/users'
import { handleApiError } from '@/lib/errorHandler'
import { HiOutlineArrowLeft, HiOutlineUser } from 'react-icons/hi2'

export default function SendNotificationPage() {
  const navigate = useNavigate()
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 300) // 300ms debounce

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch users for selection with debounced search
  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users', 'notification-selection', debouncedSearchQuery],
    queryFn: async () => {
      return usersApi.listUsers({
        page: 1,
        limit: 50,
        search: debouncedSearchQuery.trim() || undefined,
      })
    },
    enabled: true,
    staleTime: 30000, // Cache for 30 seconds
  })

  // Convert users to combobox options
  const userOptions =
    usersData?.data?.map((user: User) => ({
      value: user.id,
      label: user.email,
      description: `${user.firstname || ''} ${user.lastname || ''}`.trim() || 'No name',
    })) || []

  const selectedUser = usersData?.data?.find((user: User) => user.id === selectedUserId)

  const handleSubmit = async (data: NotificationFormData) => {
    if (!selectedUserId) {
      throw new Error('Please select a user')
    }

    const request: SendNotificationRequest = {
      userId: selectedUserId,
      title: data.title,
      body: data.body,
      channels: data.channels,
    }

    try {
      await notificationsApi.sendNotification(request)
    } catch (error) {
      handleApiError(error)
      throw error
    }
  }

  const handleSuccess = () => {
    // Optionally navigate or refresh
    setSelectedUserId('')
  }

  // Note: Permission check is handled by the API error handler

  return (
    <div className="space-y-6">
      <PageHeader
        title="Send Notification"
        description="Send push and email notifications to a specific user"
        actions={
          <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="gap-2">
            <HiOutlineArrowLeft className="h-4 w-4" />
            Back
          </Button>
        }
      />

      {/* User Selection */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="user-select">
                Select User <span className="text-destructive">*</span>
              </Label>
              <Combobox
                options={userOptions}
                value={selectedUserId}
                onValueChange={(value) => setSelectedUserId(value || '')}
                onSearchChange={(query) => setSearchQuery(query)}
                placeholder="Search and select a user..."
                searchPlaceholder="Search by email or name..."
                emptyText="No users found"
                disabled={isLoadingUsers}
              />
              {selectedUser && (
                <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <HiOutlineUser className="h-4 w-4" />
                  <span>
                    {selectedUser.firstname} {selectedUser.lastname} ({selectedUser.email})
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Form */}
      {selectedUserId && (
        <NotificationForm
          userId={selectedUserId}
          onSubmit={handleSubmit}
          onSuccess={handleSuccess}
          title="Send Notification"
          description={`Send notification to ${selectedUser?.email || 'selected user'}`}
        />
      )}

      {!selectedUserId && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground text-center py-8">
              Please select a user above to send a notification
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
