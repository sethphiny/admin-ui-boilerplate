import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldLabel, FieldError, FieldDescription, FieldGroup } from '@/components/ui/field'
import { NotificationChannel } from '@/types/notifications/notification.types'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'
import { HiOutlineBell, HiOutlineEnvelope, HiOutlineDevicePhoneMobile } from 'react-icons/hi2'
import Loader from '@/components/misc/Loader'

const notificationSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be 100 characters or less'),
  body: z.string().min(1, 'Message is required').max(500, 'Message must be 500 characters or less'),
  channels: z.array(z.enum(['PUSH', 'EMAIL'])).min(1, 'Please select at least one channel'),
})

export type NotificationFormData = z.infer<typeof notificationSchema>

interface NotificationFormProps {
  userId?: string
  onSuccess?: () => void
  onSubmit: (data: NotificationFormData) => Promise<void>
  submitLabel?: string
  title?: string
  description?: string
}

export function NotificationForm({
  userId,
  onSuccess,
  onSubmit,
  submitLabel,
  title,
  description,
}: NotificationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedChannels, setSelectedChannels] = useState<NotificationChannel[]>(['PUSH'])

  const form = useForm<NotificationFormData>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      title: '',
      body: '',
      channels: ['PUSH'],
    },
  })

  const { handleSubmit, reset, watch, setValue } = form

  const handleChannelToggle = (channel: NotificationChannel, checked: boolean) => {
    const newChannels = checked
      ? [...selectedChannels, channel]
      : selectedChannels.filter((c) => c !== channel)
    setSelectedChannels(newChannels)
    setValue('channels', newChannels, { shouldValidate: true })
  }

  const onFormSubmit = async (data: NotificationFormData) => {
    if (selectedChannels.length === 0) {
      showErrorToast('Please select at least one channel')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit({
        ...data,
        channels: selectedChannels,
      })
      showSuccessToast('Notification sent successfully')
      reset()
      setSelectedChannels(['PUSH'])
      onSuccess?.()
    } catch (error) {
      showErrorToast(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HiOutlineBell className="h-5 w-5" />
          {title || (userId ? 'Send Notification' : 'Broadcast Notification')}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
          <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
            <FieldGroup>
              {/* Title Field */}
              <Field className="space-y-2">
                <FieldLabel htmlFor="notification-title">
                  Title <span className="text-destructive">*</span>
                </FieldLabel>
                <Controller
                  control={form.control}
                  name="title"
                  render={({ field, fieldState }) => (
                    <>
                      <Input
                        {...field}
                        id="notification-title"
                        placeholder="Enter notification title"
                        maxLength={100}
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldDescription className="text-xs">
                        {watch('title')?.length || 0}/100 characters
                      </FieldDescription>
                      <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                    </>
                  )}
                />
              </Field>

              {/* Body/Message Field */}
              <Field className="space-y-2">
                <FieldLabel htmlFor="notification-body">
                  Message <span className="text-destructive">*</span>
                </FieldLabel>
                <Controller
                  control={form.control}
                  name="body"
                  render={({ field, fieldState }) => (
                    <>
                      <Textarea
                        {...field}
                        id="notification-body"
                        placeholder="Enter notification message"
                        rows={5}
                        maxLength={500}
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldDescription className="text-xs">
                        {watch('body')?.length || 0}/500 characters
                      </FieldDescription>
                      <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                    </>
                  )}
                />
              </Field>

              {/* Channels Selection */}
              <Field className="space-y-2">
                <FieldLabel>
                  Channels <span className="text-destructive">*</span>
                </FieldLabel>
                <Controller
                  control={form.control}
                  name="channels"
                  render={({ fieldState }) => (
                    <>
                      <div className="flex flex-col gap-3">
                        <Field orientation="horizontal" className="flex items-center gap-3">
                          <Checkbox
                            id="channel-push"
                            checked={selectedChannels.includes('PUSH')}
                            onCheckedChange={(checked) => handleChannelToggle('PUSH', checked === true)}
                          />
                          <FieldLabel
                            htmlFor="channel-push"
                            className="flex items-center gap-2 cursor-pointer font-normal"
                          >
                            <HiOutlineDevicePhoneMobile className="h-4 w-4" />
                            Push Notification
                          </FieldLabel>
                        </Field>
                        <Field orientation="horizontal" className="flex items-center gap-3">
                          <Checkbox
                            id="channel-email"
                            checked={selectedChannels.includes('EMAIL')}
                            onCheckedChange={(checked) => handleChannelToggle('EMAIL', checked === true)}
                          />
                          <FieldLabel
                            htmlFor="channel-email"
                            className="flex items-center gap-2 cursor-pointer font-normal"
                          >
                            <HiOutlineEnvelope className="h-4 w-4" />
                            Email
                          </FieldLabel>
                        </Field>
                      </div>
                      {selectedChannels.length === 0 && fieldState.error && (
                        <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                      )}
                      {!fieldState.error && selectedChannels.length === 0 && (
                        <p className="text-sm text-destructive">Please select at least one channel</p>
                      )}
                      <FieldDescription className="text-xs">
                        Admin notifications bypass user preferences
                      </FieldDescription>
                    </>
                  )}
                />
              </Field>
            </FieldGroup>

          {/* Submit Button */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset()
                setSelectedChannels(['PUSH'])
              }}
              disabled={isSubmitting}
            >
              Reset
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || selectedChannels.length === 0}
              className="min-w-[140px]"
            >
              {isSubmitting ? (
                <>
                  <Loader className="mr-2 h-4 w-4" />
                  Sending...
                </>
              ) : (
                submitLabel || (userId ? 'Send Notification' : 'Broadcast to All Users')
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
