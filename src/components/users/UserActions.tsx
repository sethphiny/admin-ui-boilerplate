import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Field, FieldLabel, FieldError, FieldGroup } from '@/components/ui/field'
import { usersApi } from '@/api/endpoints/users/users'
import {
  SuspendUserDto,
  ActivateUserDto,
  ResetPasswordDto,
  UpdateUserDto,
  UpdateLoyaltyPointsDto,
} from '@/types/user/users'
import { showSuccessToast, showErrorToast } from '@/lib/errorHandler'
import {
  HiOutlineKey,
  HiOutlineLockClosed,
  HiOutlineXCircle,
  HiOutlineCheckCircle,
  HiOutlinePencil,
  HiOutlineGift,
} from 'react-icons/hi2'

interface UserActionsProps {
  userId: string
  userStatus: 'active' | 'suspended' | 'inactive'
  userEmail: string
}

const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
})

const suspendUserSchema = z.object({
  reason: z.string().min(1, 'Reason is required'),
})

const activateUserSchema = z.object({
  reason: z.string().min(1, 'Reason is required'),
})

const updateUserSchema = z.object({
  firstname: z.string().optional(),
  lastname: z.string().optional(),
  phone: z.string().optional(),
})

const updateLoyaltyPointsSchema = z.object({
  points: z.number().min(-1000000, 'Points must be a valid number').max(1000000, 'Points must be reasonable'),
  reason: z.string().min(1, 'Reason is required'),
})

export function UserActions({ userId, userStatus, userEmail }: UserActionsProps) {
  const queryClient = useQueryClient()
  const [showResetPinModal, setShowResetPinModal] = useState(false)
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false)
  const [showSuspendModal, setShowSuspendModal] = useState(false)
  const [showActivateModal, setShowActivateModal] = useState(false)
  const [showUpdateUserModal, setShowUpdateUserModal] = useState(false)
  const [showUpdateLoyaltyPointsModal, setShowUpdateLoyaltyPointsModal] = useState(false)

  const resetPasswordForm = useForm<ResetPasswordDto>({
    resolver: zodResolver(resetPasswordSchema),
  })

  const suspendUserForm = useForm<SuspendUserDto>({
    resolver: zodResolver(suspendUserSchema),
  })

  const activateUserForm = useForm<ActivateUserDto>({
    resolver: zodResolver(activateUserSchema),
  })

  const updateUserForm = useForm<UpdateUserDto>({
    resolver: zodResolver(updateUserSchema),
  })

  const updateLoyaltyPointsForm = useForm<UpdateLoyaltyPointsDto>({
    resolver: zodResolver(updateLoyaltyPointsSchema),
  })

  const resetPinMutation = useMutation({
    mutationFn: () => usersApi.resetUserPin(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', userId] })
      showSuccessToast('PIN reset successfully. User will be prompted to set PIN on next login.')
      setShowResetPinModal(false)
    },
    onError: (error) => {
      showErrorToast(error)
    },
  })

  const resetPasswordMutation = useMutation({
    mutationFn: (data: ResetPasswordDto) => usersApi.resetUserPassword(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', userId] })
      showSuccessToast('Password reset successfully')
      setShowResetPasswordModal(false)
      resetPasswordForm.reset()
    },
    onError: (error) => {
      showErrorToast(error)
    },
  })

  const suspendUserMutation = useMutation({
    mutationFn: (data: SuspendUserDto) => usersApi.suspendUser(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', userId] })
      showSuccessToast('User suspended successfully')
      setShowSuspendModal(false)
      suspendUserForm.reset()
    },
    onError: (error) => {
      showErrorToast(error)
    },
  })

  const activateUserMutation = useMutation({
    mutationFn: (data: ActivateUserDto) => usersApi.activateUser(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', userId] })
      showSuccessToast('User activated successfully')
      setShowActivateModal(false)
      activateUserForm.reset()
    },
    onError: (error) => {
      showErrorToast(error)
    },
  })

  const updateUserMutation = useMutation({
    mutationFn: (data: UpdateUserDto) => usersApi.updateUser(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', userId] })
      showSuccessToast('User updated successfully')
      setShowUpdateUserModal(false)
      updateUserForm.reset()
    },
    onError: (error) => {
      showErrorToast(error)
    },
  })

  const updateLoyaltyPointsMutation = useMutation({
    mutationFn: (data: UpdateLoyaltyPointsDto) => usersApi.updateLoyaltyPoints(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', userId] })
      showSuccessToast('Loyalty points updated successfully')
      setShowUpdateLoyaltyPointsModal(false)
      updateLoyaltyPointsForm.reset()
    },
    onError: (error) => {
      showErrorToast(error)
    },
  })

  const isSuspended = userStatus === 'suspended'

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>User Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowResetPinModal(true)}
              className="flex items-center gap-2"
            >
              <HiOutlineKey className="h-4 w-4" />
              Reset PIN
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowResetPasswordModal(true)}
              className="flex items-center gap-2"
            >
              <HiOutlineLockClosed className="h-4 w-4" />
              Reset Password
            </Button>
            {isSuspended ? (
              <Button
                variant="default"
                size="sm"
                onClick={() => setShowActivateModal(true)}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
              >
                <HiOutlineCheckCircle className="h-4 w-4" />
                Activate User
              </Button>
            ) : (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowSuspendModal(true)}
                className="flex items-center gap-2"
              >
                <HiOutlineXCircle className="h-4 w-4" />
                Suspend User
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowUpdateUserModal(true)}
              className="flex items-center gap-2"
            >
              <HiOutlinePencil className="h-4 w-4" />
              Update User
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowUpdateLoyaltyPointsModal(true)}
              className="flex items-center gap-2"
            >
              <HiOutlineGift className="h-4 w-4" />
              Update Loyalty Points
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reset PIN Modal */}
      <Dialog open={showResetPinModal} onOpenChange={setShowResetPinModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset User PIN</DialogTitle>
            <DialogDescription>
              This will clear the user's PIN. The user will be prompted to set a new PIN on their next login.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Warning:</strong> The user will need to set a new PIN before they can perform transactions
                that require PIN verification.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetPinModal(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => resetPinMutation.mutate()}
              disabled={resetPinMutation.isPending}
            >
              {resetPinMutation.isPending ? 'Resetting...' : 'Reset PIN'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Modal */}
      <Dialog open={showResetPasswordModal} onOpenChange={setShowResetPasswordModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset User Password</DialogTitle>
            <DialogDescription>Enter a new password for {userEmail}</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={resetPasswordForm.handleSubmit((data) => resetPasswordMutation.mutate(data))}
            className="space-y-4"
          >
            <FieldGroup>
              <Field className="space-y-2">
                <FieldLabel htmlFor="new-password">New Password *</FieldLabel>
                <Controller
                  control={resetPasswordForm.control}
                  name="newPassword"
                  render={({ field, fieldState }) => (
                    <>
                      <Input
                        {...field}
                        id="new-password"
                        type="password"
                        placeholder="Enter new password"
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                      <p className="text-xs text-muted-foreground">Password must be at least 8 characters</p>
                    </>
                  )}
                />
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowResetPasswordModal(false)
                  resetPasswordForm.reset()
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={resetPasswordMutation.isPending}>
                {resetPasswordMutation.isPending ? 'Resetting...' : 'Reset Password'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Suspend User Modal */}
      <Dialog open={showSuspendModal} onOpenChange={setShowSuspendModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend User</DialogTitle>
            <DialogDescription>Suspend user account: {userEmail}</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={suspendUserForm.handleSubmit((data) => suspendUserMutation.mutate(data))}
            className="space-y-4"
          >
            <FieldGroup>
              <Field className="space-y-2">
                <FieldLabel htmlFor="suspend-reason">Reason *</FieldLabel>
                <Controller
                  control={suspendUserForm.control}
                  name="reason"
                  render={({ field, fieldState }) => (
                    <>
                      <Textarea
                        {...field}
                        id="suspend-reason"
                        placeholder="Enter reason for suspension"
                        rows={4}
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                    </>
                  )}
                />
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowSuspendModal(false)
                  suspendUserForm.reset()
                }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="destructive" disabled={suspendUserMutation.isPending}>
                {suspendUserMutation.isPending ? 'Suspending...' : 'Suspend User'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Activate User Modal */}
      <Dialog open={showActivateModal} onOpenChange={setShowActivateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Activate User</DialogTitle>
            <DialogDescription>Activate user account: {userEmail}</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={activateUserForm.handleSubmit((data) => activateUserMutation.mutate(data))}
            className="space-y-4"
          >
            <FieldGroup>
              <Field className="space-y-2">
                <FieldLabel htmlFor="activate-reason">Reason *</FieldLabel>
                <Controller
                  control={activateUserForm.control}
                  name="reason"
                  render={({ field, fieldState }) => (
                    <>
                      <Textarea
                        {...field}
                        id="activate-reason"
                        placeholder="Enter reason for activation"
                        rows={4}
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                    </>
                  )}
                />
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowActivateModal(false)
                  activateUserForm.reset()
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={activateUserMutation.isPending}>
                {activateUserMutation.isPending ? 'Activating...' : 'Activate User'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Update User Modal */}
      <Dialog open={showUpdateUserModal} onOpenChange={setShowUpdateUserModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update User</DialogTitle>
            <DialogDescription>Update user information for {userEmail}</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={updateUserForm.handleSubmit((data) => updateUserMutation.mutate(data))}
            className="space-y-4"
          >
            <FieldGroup>
              <Field className="space-y-2">
                <FieldLabel htmlFor="update-firstname">First Name</FieldLabel>
                <Controller
                  control={updateUserForm.control}
                  name="firstname"
                  render={({ field, fieldState }) => (
                    <>
                      <Input
                        {...field}
                        id="update-firstname"
                        placeholder="First name"
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                    </>
                  )}
                />
              </Field>
              <Field className="space-y-2">
                <FieldLabel htmlFor="update-lastname">Last Name</FieldLabel>
                <Controller
                  control={updateUserForm.control}
                  name="lastname"
                  render={({ field, fieldState }) => (
                    <>
                      <Input
                        {...field}
                        id="update-lastname"
                        placeholder="Last name"
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                    </>
                  )}
                />
              </Field>
              <Field className="space-y-2">
                <FieldLabel htmlFor="update-phone">Phone</FieldLabel>
                <Controller
                  control={updateUserForm.control}
                  name="phone"
                  render={({ field, fieldState }) => (
                    <>
                      <Input
                        {...field}
                        id="update-phone"
                        placeholder="+1234567890"
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                    </>
                  )}
                />
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowUpdateUserModal(false)
                  updateUserForm.reset()
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateUserMutation.isPending}>
                {updateUserMutation.isPending ? 'Updating...' : 'Update User'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Update Loyalty Points Modal */}
      <Dialog open={showUpdateLoyaltyPointsModal} onOpenChange={setShowUpdateLoyaltyPointsModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Loyalty Points</DialogTitle>
            <DialogDescription>Update loyalty points for {userEmail}</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={updateLoyaltyPointsForm.handleSubmit((data) => updateLoyaltyPointsMutation.mutate(data))}
            className="space-y-4"
          >
            <FieldGroup>
              <Field className="space-y-2">
                <FieldLabel htmlFor="loyalty-points">Points *</FieldLabel>
                <Controller
                  control={updateLoyaltyPointsForm.control}
                  name="points"
                  render={({ field, fieldState }) => (
                    <>
                      <Input
                        {...field}
                        id="loyalty-points"
                        type="number"
                        placeholder="100"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                      <p className="text-xs text-muted-foreground">
                        Enter positive number to add points, negative to remove
                      </p>
                    </>
                  )}
                />
              </Field>
              <Field className="space-y-2">
                <FieldLabel htmlFor="loyalty-reason">Reason *</FieldLabel>
                <Controller
                  control={updateLoyaltyPointsForm.control}
                  name="reason"
                  render={({ field, fieldState }) => (
                    <>
                      <Textarea
                        {...field}
                        id="loyalty-reason"
                        placeholder="Enter reason for points change"
                        rows={3}
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                    </>
                  )}
                />
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowUpdateLoyaltyPointsModal(false)
                  updateLoyaltyPointsForm.reset()
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateLoyaltyPointsMutation.isPending}>
                {updateLoyaltyPointsMutation.isPending ? 'Updating...' : 'Update Points'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
