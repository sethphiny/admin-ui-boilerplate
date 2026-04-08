import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { adminsApi } from '@/api/endpoints/admins/admins'
import { rbacApi } from '@/api/endpoints/rbac/rbac'
import Loader from '@/components/misc/Loader'
import { PermissionError } from '@/components/misc/PermissionError'
import { isPermissionError, handleApiError, showErrorToast, showSuccessToast } from '@/lib/errorHandler'
import { formatDateTime } from '@/lib/dateUtils'
import { HiOutlineArrowLeft, HiOutlineLockClosed, HiOutlineLockOpen, HiOutlineKey, HiOutlinePencil } from 'react-icons/hi2'
import { UpdateAdminDto, SuspendAdminDto, ChangeAdminPasswordDto } from '@/types/admin/admins'
import { Permission, AssignPermissionsDto } from '@/types/admin/rbac'
import { Checkbox } from '@/components/ui/checkbox'

export default function AdminDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [selectedRoleId, setSelectedRoleId] = useState<string>('')
  const [isChangingRole, setIsChangingRole] = useState(false)
  const [isManagingPermissions, setIsManagingPermissions] = useState(false)
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([])
  const [isSuspending, setIsSuspending] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [suspendReason, setSuspendReason] = useState('')
  const [passwordData, setPasswordData] = useState({ newPassword: '', oldPassword: '' })

  // Fetch admin details
  const { data: admin, isLoading, error } = useQuery({
    queryKey: ['admin', id],
    queryFn: () => adminsApi.getAdminById(id!),
    enabled: !!id,
  })

  // Set selected role when admin data loads
  useEffect(() => {
    if (admin?.role?.id) {
      setSelectedRoleId(admin.role.id)
    }
  }, [admin?.role?.id])

  // Fetch all roles for role selector
  const { data: rolesData, error: rolesError } = useQuery({
    queryKey: ['roles'],
    queryFn: () => rbacApi.listRoles({ limit: 100 }),
    retry: false,
  })

  // Fetch role permissions
  const { data: rolePermissions, error: rolePermissionsError } = useQuery({
    queryKey: ['role-permissions', admin?.role.id],
    queryFn: () => rbacApi.getRolePermissions(admin!.role.id),
    enabled: !!admin?.role.id,
    retry: false,
  })

  // Fetch admin effective permissions
  const { data: adminPermissions, error: adminPermissionsError } = useQuery({
    queryKey: ['admin-permissions', id],
    queryFn: () => rbacApi.getAdminPermissions(id!),
    enabled: !!id,
    retry: false,
  })

  // Fetch all available permissions (with pagination if needed)
  const { data: allPermissionsData, error: allPermissionsError } = useQuery({
    queryKey: ['all-permissions'],
    queryFn: async () => {
      // Fetch first page
      const firstPage = await rbacApi.listPermissions({ limit: 100, page: 1 })
      const allPermissions = [...firstPage.data]
      
      // If there are more pages, fetch them
      if (firstPage.meta.totalPages > 1) {
        const remainingPages = []
        for (let page = 2; page <= firstPage.meta.totalPages; page++) {
          const pageData = await rbacApi.listPermissions({ limit: 100, page })
          remainingPages.push(...pageData.data)
        }
        allPermissions.push(...remainingPages)
      }
      
      return {
        data: allPermissions,
        meta: firstPage.meta,
      }
    },
    retry: false,
  })

  // Update admin role mutation
  const updateRoleMutation = useMutation({
    mutationFn: (data: UpdateAdminDto) => adminsApi.updateAdmin(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', id] })
      queryClient.invalidateQueries({ queryKey: ['role-permissions'] })
      queryClient.invalidateQueries({ queryKey: ['admin-permissions', id] })
      showSuccessToast('Admin role updated successfully')
      setIsChangingRole(false)
    },
    onError: (error) => {
      showErrorToast(error)
    },
  })

  // Suspend admin mutation
  const suspendMutation = useMutation({
    mutationFn: (data: SuspendAdminDto) => adminsApi.suspendAdmin(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', id] })
      queryClient.invalidateQueries({ queryKey: ['admins'] })
      showSuccessToast('Admin suspended successfully')
      setIsSuspending(false)
      setSuspendReason('')
    },
    onError: (error) => {
      showErrorToast(error)
    },
  })

  // Activate admin mutation
  const activateMutation = useMutation({
    mutationFn: () => adminsApi.activateAdmin(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', id] })
      queryClient.invalidateQueries({ queryKey: ['admins'] })
      showSuccessToast('Admin activated successfully')
    },
    onError: (error) => {
      showErrorToast(error)
    },
  })

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: (data: ChangeAdminPasswordDto) => adminsApi.changeAdminPassword(id!, data),
    onSuccess: () => {
      showSuccessToast('Password changed successfully')
      setIsChangingPassword(false)
      setPasswordData({ newPassword: '', oldPassword: '' })
    },
    onError: (error) => {
      showErrorToast(error)
    },
  })

  // Update role permissions mutation
  const updateRolePermissionsMutation = useMutation({
    mutationFn: (data: AssignPermissionsDto) => rbacApi.assignPermissionsToRole(admin!.role.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-permissions', admin?.role.id] })
      queryClient.invalidateQueries({ queryKey: ['admin-permissions', id] })
      queryClient.invalidateQueries({ queryKey: ['admin', id] })
      showSuccessToast('Permissions updated successfully')
      setIsManagingPermissions(false)
    },
    onError: (error) => {
      showErrorToast(error)
    },
  })

  // Assign permissions to admin directly (if supported)
  const assignAdminPermissionsMutation = useMutation({
    mutationFn: (data: AssignPermissionsDto) => rbacApi.assignPermissionsToAdmin(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-permissions', id] })
      queryClient.invalidateQueries({ queryKey: ['admin', id] })
      showSuccessToast('Permissions assigned successfully')
      setIsManagingPermissions(false)
    },
    onError: (error) => {
      // If direct assignment fails, try updating role permissions instead
      if (admin?.role.id) {
        const data: AssignPermissionsDto = { permissionIds: selectedPermissionIds }
        updateRolePermissionsMutation.mutate(data)
      } else {
        showErrorToast(error)
      }
    },
  })

  const handleRoleChange = () => {
    if (selectedRoleId && selectedRoleId !== admin?.role.id) {
      updateRoleMutation.mutate({ roleId: selectedRoleId })
    }
  }

  const handlePermissionToggle = (permissionId: string) => {
    setSelectedPermissionIds((prev) =>
      prev.includes(permissionId) ? prev.filter((id) => id !== permissionId) : [...prev, permissionId]
    )
  }

  const handleSelectAllInSection = (permissionIds: string[]) => {
    setSelectedPermissionIds((prev) => {
      const newIds = [...prev]
      permissionIds.forEach((id) => {
        if (!newIds.includes(id)) {
          newIds.push(id)
        }
      })
      return newIds
    })
  }

  const handleDeselectAllInSection = (permissionIds: string[]) => {
    setSelectedPermissionIds((prev) => prev.filter((id) => !permissionIds.includes(id)))
  }

  const handleSavePermissions = () => {
    if (selectedPermissionIds.length === 0) {
      showErrorToast('Please select at least one permission')
      return
    }
    
    const data: AssignPermissionsDto = { permissionIds: selectedPermissionIds }
    
    // Try direct admin permission assignment first, fallback to role permissions
    assignAdminPermissionsMutation.mutate(data)
  }

  // Initialize selected permissions when entering edit mode
  const handleStartManagingPermissions = () => {
    const currentPermIds = permissions.map((p) => p.id)
    setSelectedPermissionIds(currentPermIds)
    setIsManagingPermissions(true)
  }

  const handleSuspend = () => {
    if (!suspendReason.trim()) {
      showErrorToast('Please provide a reason for suspension')
      return
    }
    suspendMutation.mutate({ reason: suspendReason })
  }

  const handleChangePassword = () => {
    if (!passwordData.newPassword.trim()) {
      showErrorToast('Please enter a new password')
      return
    }
    changePasswordMutation.mutate(passwordData)
  }

  const formatDate = (dateString: string | undefined | null): string => {
    if (!dateString) return 'N/A'
    return formatDateTime(dateString)
  }

  // Group permissions by resource
  const groupedPermissions = (permissions: Permission[] | undefined) => {
    if (!permissions || !Array.isArray(permissions)) return {}
    return permissions.reduce((acc, perm) => {
      const resource = perm.resource
      if (!acc[resource]) {
        acc[resource] = []
      }
      acc[resource].push(perm)
      return acc
    }, {} as Record<string, Permission[]>)
  }

  if (isLoading) {
    return <Loader fullScreen />
  }

  // Check for permission errors first
  if (error && isPermissionError(error)) {
    return (
      <PermissionError
        message={handleApiError(error)}
        variant="full"
        onGoBack={() => navigate('/admins')}
      />
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{handleApiError(error)}</p>
            <Button onClick={() => navigate('/admins')} variant="outline" className="mt-4">
              <HiOutlineArrowLeft className="h-4 w-4 mr-2" />
              Back to Admins
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!admin) {
    return <div>Admin not found</div>
  }

  // Safely get permissions, ensuring they're arrays
  const permissions = Array.isArray(adminPermissions)
    ? adminPermissions
    : Array.isArray(rolePermissions)
      ? rolePermissions
      : []
  const groupedPerms = groupedPermissions(permissions)
  
  // Check if we have permission errors for permissions queries (non-blocking)
  const hasPermissionErrors = isPermissionError(rolePermissionsError) || isPermissionError(adminPermissionsError)

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${admin.firstname} ${admin.lastname}`}
        description={admin.email}
        actions={
          <Button variant="outline" onClick={() => navigate('/admins')}>
            <HiOutlineArrowLeft className="h-4 w-4 mr-2" />
            Back to Admins
          </Button>
        }
      />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Admin Information */}
        <Card>
          <CardHeader>
            <CardTitle>Admin Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <p>{admin.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">First Name</label>
              <p>{admin.firstname}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Last Name</label>
              <p>{admin.lastname}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <div>
                <Badge className={admin.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                  {admin.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Created At</label>
              <p>{formatDate(admin.createdAt)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Updated At</label>
              <p>{formatDate(admin.updatedAt)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Role & Permissions */}
        <Card>
          <CardHeader>
            <CardTitle>Role & Permissions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Current Role</Label>
              {isChangingRole ? (
                <div className="space-y-2 mt-2">
                  {isPermissionError(rolesError) ? (
                    <div className="text-sm text-muted-foreground p-2 border rounded">
                      Unable to load roles. You may not have permission to view roles.
                    </div>
                  ) : (
                    <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        {rolesData?.data?.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleRoleChange}
                      disabled={updateRoleMutation.isPending || selectedRoleId === admin.role.id}
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsChangingRole(false)
                        setSelectedRoleId(admin.role.id)
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-base px-3 py-1">
                      {admin.role.name}
                    </Badge>
                    <Button size="sm" variant="ghost" onClick={() => setIsChangingRole(true)}>
                      Change Role
                    </Button>
                  </div>
                  {admin.role.description && (
                    <p className="text-sm text-muted-foreground mt-2">{admin.role.description}</p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Effective Permissions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Effective Permissions</CardTitle>
              <p className="text-sm text-muted-foreground">
                Permissions inherited from role: <strong>{admin.role.name}</strong>
              </p>
            </div>
            {!isManagingPermissions && !hasPermissionErrors && (
              <Button size="sm" variant="outline" onClick={handleStartManagingPermissions}>
                <HiOutlinePencil className="h-4 w-4 mr-2" />
                Manage Permissions
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {hasPermissionErrors ? (
            <div className="text-sm text-muted-foreground">
              <p>Unable to load permissions. You may not have permission to view permission details.</p>
            </div>
          ) : isManagingPermissions ? (
            <div className="space-y-4">
              {isPermissionError(allPermissionsError) ? (
                <div className="text-sm text-muted-foreground p-2 border rounded">
                  Unable to load available permissions. You may not have permission to view permissions.
                </div>
              ) : (
                <>
                  <div className="max-h-96 overflow-y-auto space-y-4 border rounded-lg p-4">
                    {allPermissionsData?.data && allPermissionsData.data.length > 0 ? (
                      Object.entries(
                        allPermissionsData.data.reduce((acc, perm) => {
                          const resource = perm.resource
                          if (!acc[resource]) {
                            acc[resource] = []
                          }
                          acc[resource].push(perm)
                          return acc
                        }, {} as Record<string, Permission[]>)
                      ).map(([resource, perms]) => {
                        const sectionPermissionIds = perms.map((p) => p.id)
                        const allSelected = sectionPermissionIds.every((id) => selectedPermissionIds.includes(id))
                        const someSelected = sectionPermissionIds.some((id) => selectedPermissionIds.includes(id))
                        
                        return (
                          <div key={resource} className="space-y-2 border-b pb-3 last:border-b-0">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold text-sm capitalize">{resource}</h4>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 text-xs"
                                  onClick={() => handleSelectAllInSection(sectionPermissionIds)}
                                  disabled={allSelected}
                                >
                                  Select All
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 text-xs"
                                  onClick={() => handleDeselectAllInSection(sectionPermissionIds)}
                                  disabled={!someSelected}
                                >
                                  Deselect All
                                </Button>
                              </div>
                            </div>
                            <div className="space-y-2 pl-4">
                              {perms.map((perm) => (
                                <div key={perm.id} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`perm-${perm.id}`}
                                    checked={selectedPermissionIds.includes(perm.id)}
                                    onChange={() => handlePermissionToggle(perm.id)}
                                  />
                                  <label
                                    htmlFor={`perm-${perm.id}`}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                  >
                                    {perm.action}
                                    {perm.description && (
                                      <span className="ml-1 text-muted-foreground">({perm.description})</span>
                                    )}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <p className="text-sm text-muted-foreground">No permissions available</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleSavePermissions}
                      disabled={
                        assignAdminPermissionsMutation.isPending || updateRolePermissionsMutation.isPending
                      }
                    >
                      Save Permissions
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsManagingPermissions(false)
                        setSelectedPermissionIds([])
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </>
              )}
            </div>
          ) : Object.keys(groupedPerms).length === 0 ? (
            <p className="text-sm text-muted-foreground">No permissions assigned</p>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedPerms).map(([resource, perms]) => (
                <div key={resource} className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2 capitalize">{resource}</h4>
                  <div className="flex flex-wrap gap-2">
                    {perms.map((perm) => (
                      <Badge key={perm.id} variant="outline" className="text-xs">
                        {perm.action}
                        {perm.description && (
                          <span className="ml-1 text-muted-foreground">({perm.description})</span>
                        )}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {/* Suspend/Activate */}
            {admin.isActive ? (
              <Dialog open={isSuspending} onOpenChange={setIsSuspending}>
                <DialogTrigger asChild>
                  <Button variant="destructive">
                    <HiOutlineLockClosed className="h-4 w-4 mr-2" />
                    Suspend Admin
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Suspend Admin</DialogTitle>
                    <DialogDescription>Please provide a reason for suspending this admin.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Reason</Label>
                      <Textarea
                        placeholder="Enter reason for suspension..."
                        value={suspendReason}
                        onChange={(e) => setSuspendReason(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsSuspending(false)}>
                      Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleSuspend} disabled={suspendMutation.isPending}>
                      Suspend
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            ) : (
              <Button variant="default" onClick={() => activateMutation.mutate()} disabled={activateMutation.isPending}>
                <HiOutlineLockOpen className="h-4 w-4 mr-2" />
                Activate Admin
              </Button>
            )}

            {/* Change Password */}
            <Dialog open={isChangingPassword} onOpenChange={setIsChangingPassword}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <HiOutlineKey className="h-4 w-4 mr-2" />
                  Change Password
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Change Password</DialogTitle>
                  <DialogDescription>Set a new password for this admin.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>New Password</Label>
                    <Input
                      type="password"
                      placeholder="Enter new password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Old Password (Optional)</Label>
                    <Input
                      type="password"
                      placeholder="Enter old password (if changing own password)"
                      value={passwordData.oldPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsChangingPassword(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleChangePassword} disabled={changePasswordMutation.isPending}>
                    Change Password
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

