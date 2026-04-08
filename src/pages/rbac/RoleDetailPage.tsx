import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldLabel, FieldError, FieldGroup } from '@/components/ui/field'
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
import { rbacApi } from '@/api/endpoints/rbac/rbac'
import { adminsApi } from '@/api/endpoints/admins/admins'
import Loader from '@/components/misc/Loader'
import { PermissionError } from '@/components/misc/PermissionError'
import { isPermissionError, handleApiError, showErrorToast, showSuccessToast } from '@/lib/errorHandler'
import { formatDateTime } from '@/lib/dateUtils'
import { HiOutlineArrowLeft, HiOutlinePencil, HiOutlineTrash } from 'react-icons/hi2'
import { UpdateRoleDto, AssignPermissionsDto, Permission } from '@/types/admin/rbac'
import { PaginatedResponse } from '@/types/api/api'
import { Admin } from '@/types/admin/admins'

// Zod schema for update role form
const updateRoleSchema = z.object({
  name: z.string().min(1, 'Role name is required'),
  description: z.string().optional(),
  isActive: z.boolean(),
})

export default function RoleDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [isEditing, setIsEditing] = useState(false)
  const [isManagingPermissions, setIsManagingPermissions] = useState(false)
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([])
  const [isDeleting, setIsDeleting] = useState(false)

  // Fetch role details
  const { data: role, isLoading, error } = useQuery({
    queryKey: ['role', id],
    queryFn: () => rbacApi.getRoleById(id!),
    enabled: !!id,
  })

  // Fetch role permissions
  const { data: rolePermissions, error: rolePermissionsError } = useQuery({
    queryKey: ['role-permissions', id],
    queryFn: () => rbacApi.getRolePermissions(id!),
    enabled: !!id,
    retry: false,
  })

  // Fetch all available permissions
  const { data: allPermissionsData, error: allPermissionsError } = useQuery({
    queryKey: ['all-permissions'],
    queryFn: async () => {
      const firstPage = await rbacApi.listPermissions({ limit: 100, page: 1 })
      const allPermissions = [...firstPage.data]

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

  // Fetch admins with this role
  const { data: adminsData } = useQuery({
    queryKey: ['admins-by-role', id],
    queryFn: async () => {
      const allAdmins: Admin[] = []
      let page = 1
      let hasMore = true

      while (hasMore) {
        const response: PaginatedResponse<Admin> = await adminsApi.listAdmins({ page, limit: 100 })
        allAdmins.push(...response.data)
        hasMore = page < response.meta.totalPages
        page++
      }

      // Filter admins by role
      return allAdmins.filter((admin) => admin.role.id === id)
    },
    enabled: !!id,
    retry: false,
  })

  // Update role form
  const updateRoleForm = useForm<UpdateRoleDto>({
    resolver: zodResolver(updateRoleSchema),
  })

  // Set form values when role data loads
  useEffect(() => {
    if (role) {
      updateRoleForm.reset({
        name: role.name,
        description: role.description || '',
        isActive: role.isActive,
      })
    }
  }, [role])

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: (data: UpdateRoleDto) => rbacApi.updateRole(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role', id] })
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      showSuccessToast('Role updated successfully')
      setIsEditing(false)
    },
    onError: (error) => {
      showErrorToast(error)
    },
  })

  // Delete role mutation
  const deleteRoleMutation = useMutation({
    mutationFn: () => rbacApi.deleteRole(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      showSuccessToast('Role deleted successfully')
      navigate('/rbac/roles')
    },
    onError: (error) => {
      showErrorToast(error)
    },
  })

  // Update role permissions mutation
  const updateRolePermissionsMutation = useMutation({
    mutationFn: (data: AssignPermissionsDto) => rbacApi.assignPermissionsToRole(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-permissions', id] })
      queryClient.invalidateQueries({ queryKey: ['role', id] })
      showSuccessToast('Permissions updated successfully')
      setIsManagingPermissions(false)
      setSelectedPermissionIds([])
    },
    onError: (error) => {
      showErrorToast(error)
    },
  })

  const handleUpdateRole = (data: UpdateRoleDto) => {
    updateRoleMutation.mutate(data)
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
    updateRolePermissionsMutation.mutate(data)
  }

  const handleStartManagingPermissions = () => {
    const currentPermIds = rolePermissions?.map((p) => p.id) || []
    setSelectedPermissionIds(currentPermIds)
    setIsManagingPermissions(true)
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

  if (error && isPermissionError(error)) {
    return (
      <PermissionError
        message={handleApiError(error)}
        variant="full"
        onGoBack={() => navigate('/rbac/roles')}
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
            <Button onClick={() => navigate('/rbac/roles')} variant="outline" className="mt-4">
              <HiOutlineArrowLeft className="h-4 w-4 mr-2" />
              Back to Roles
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!role) {
    return <div>Role not found</div>
  }

  const permissions = rolePermissions || []
  const groupedPerms = groupedPermissions(permissions)
  const hasPermissionErrors = isPermissionError(rolePermissionsError) || isPermissionError(allPermissionsError)

  return (
    <div className="space-y-6">
      <PageHeader
        title={role.name}
        description={role.description || 'Role details and permissions'}
        actions={
          <Button variant="outline" onClick={() => navigate('/rbac/roles')}>
            <HiOutlineArrowLeft className="h-4 w-4 mr-2" />
            Back to Roles
          </Button>
        }
      />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Role Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Role Information</CardTitle>
              {!isEditing && (
                <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                  <HiOutlinePencil className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
                <form onSubmit={updateRoleForm.handleSubmit(handleUpdateRole)} className="space-y-4">
                  <FieldGroup>
                    <Field className="space-y-2">
                      <FieldLabel htmlFor="update-role-name">Role Name</FieldLabel>
                      <Controller
                        control={updateRoleForm.control}
                        name="name"
                        render={({ field, fieldState }) => (
                          <>
                            <Input
                              {...field}
                              id="update-role-name"
                              aria-invalid={fieldState.invalid}
                            />
                            <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                          </>
                        )}
                      />
                    </Field>

                    <Field className="space-y-2">
                      <FieldLabel htmlFor="update-role-description">Description</FieldLabel>
                      <Controller
                        control={updateRoleForm.control}
                        name="description"
                        render={({ field, fieldState }) => (
                          <>
                            <Textarea
                              {...field}
                              id="update-role-description"
                              aria-invalid={fieldState.invalid}
                            />
                            <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                          </>
                        )}
                      />
                    </Field>

                    <Field orientation="horizontal" className="flex items-center space-x-2">
                      <Controller
                        control={updateRoleForm.control}
                        name="isActive"
                        render={({ field }) => (
                          <Checkbox
                            id="update-role-active"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        )}
                      />
                      <FieldLabel htmlFor="update-role-active" className="cursor-pointer font-normal">
                        Active
                      </FieldLabel>
                    </Field>
                  </FieldGroup>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false)
                      updateRoleForm.reset()
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateRoleMutation.isPending}>
                    {updateRoleMutation.isPending ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </form>
            ) : (
              <>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                  <p className="font-semibold">{role.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <p>{role.description || 'No description'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div>
                    <Badge className={role.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {role.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created At</label>
                  <p>{formatDate(role.createdAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Updated At</label>
                  <p>{formatDate(role.updatedAt)}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Permissions Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Permissions Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Permissions</span>
                <Badge variant="outline" className="text-lg">
                  {permissions.length}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Resources</span>
                <Badge variant="outline">
                  {Object.keys(groupedPerms).length}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Permissions Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Permissions</CardTitle>
              <p className="text-sm text-muted-foreground">
                Manage permissions assigned to this role
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
                      disabled={updateRolePermissionsMutation.isPending}
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

      {/* Admins with this Role */}
      {adminsData && adminsData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Admins with this Role</CardTitle>
            <p className="text-sm text-muted-foreground">
              {adminsData.length} admin(s) assigned to this role
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {adminsData.map((admin) => (
                <div
                  key={admin.id}
                  className="flex items-center justify-between p-2 border rounded hover:bg-muted/50 cursor-pointer"
                  onClick={() => navigate(`/admins/${admin.id}`)}
                >
                  <div>
                    <p className="font-medium">{admin.firstname} {admin.lastname}</p>
                    <p className="text-sm text-muted-foreground">{admin.email}</p>
                  </div>
                  <Badge className={admin.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                    {admin.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={() => setIsDeleting(true)}
          >
            <HiOutlineTrash className="h-4 w-4 mr-2" />
            Delete Role
          </Button>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleting} onOpenChange={setIsDeleting}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the role &quot;{role.name}&quot;. This action cannot be undone.
              {adminsData && adminsData.length > 0 && (
                <span className="block mt-2 text-red-600">
                  Warning: {adminsData.length} admin(s) currently have this role assigned.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteRoleMutation.mutate()}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteRoleMutation.isPending}
            >
              {deleteRoleMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

