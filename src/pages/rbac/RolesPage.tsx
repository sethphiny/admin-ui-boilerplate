import { useState } from 'react'
import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { DataTable, Column } from '@/components/tables/DataTable'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Field, FieldLabel, FieldError, FieldGroup } from '@/components/ui/field'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Role, CreateRoleDto, UpdateRoleDto } from '@/types/admin/rbac'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { showSuccessToast, showErrorToast } from '@/lib/errorHandler'
import Loader from '@/components/misc/Loader'
import { HiOutlinePlus, HiOutlineEye, HiOutlinePencil, HiOutlineTrash, HiOutlineFunnel } from 'react-icons/hi2'
import { Card, CardContent } from '@/components/ui/card'

// Zod schema for create/update role form
const roleSchema = z.object({
  name: z.string().min(1, 'Role name is required'),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
})

export default function RolesPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState({ page: 1, limit: 20, search: '', status: 'all' as 'all' | 'active' | 'inactive' })
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [deletingRole, setDeletingRole] = useState<Role | null>(null)

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['roles', filters],
    queryFn: () => rbacApi.listRoles({ page: filters.page, limit: filters.limit }),
  })

  // Filter data client-side for search and status
  const filteredData = React.useMemo(() => {
    if (!data?.data) return []
    let result = [...data.data]
    
    // Filter by search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      result = result.filter(
        (role) =>
          role.name.toLowerCase().includes(searchLower) ||
          role.description?.toLowerCase().includes(searchLower)
      )
    }
    
    // Filter by status
    if (filters.status !== 'all') {
      result = result.filter((role) =>
        filters.status === 'active' ? role.isActive : !role.isActive
      )
    }
    
    return result
  }, [data?.data, filters.search, filters.status])

  // Create role form
  const createRoleForm = useForm<CreateRoleDto>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: '',
      description: '',
      isActive: true,
    },
  })

  // Edit role form
  const editRoleForm = useForm<UpdateRoleDto>({
    resolver: zodResolver(roleSchema.partial()),
  })

  // Create role mutation
  const createRoleMutation = useMutation({
    mutationFn: (data: CreateRoleDto) => rbacApi.createRole(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      setIsCreateDialogOpen(false)
      createRoleForm.reset()
      showSuccessToast('Role created successfully')
    },
    onError: (error) => {
      showErrorToast(error)
    },
  })

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: (data: UpdateRoleDto) => rbacApi.updateRole(editingRole!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      queryClient.invalidateQueries({ queryKey: ['role', editingRole!.id] })
      setEditingRole(null)
      editRoleForm.reset()
      showSuccessToast('Role updated successfully')
    },
    onError: (error) => {
      showErrorToast(error)
    },
  })

  // Delete role mutation
  const deleteRoleMutation = useMutation({
    mutationFn: () => rbacApi.deleteRole(deletingRole!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      setDeletingRole(null)
      showSuccessToast('Role deleted successfully')
    },
    onError: (error) => {
      showErrorToast(error)
    },
  })

  const columns: Column<Role>[] = [
    {
      id: 'name',
      header: 'Name',
      accessorKey: 'name',
    },
    {
      id: 'description',
      header: 'Description',
      cell: (row) => {
        const desc = row.description || ''
        if (desc.length > 50) {
          return (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-help">{desc.substring(0, 50)}...</span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{desc}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )
        }
        return <span>{desc || '-'}</span>
      },
    },
    {
      id: 'isActive',
      header: 'Status',
      cell: (row) => (
        <Badge className={row.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
          {row.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      id: 'permissions',
      header: 'Permissions',
      cell: (row) => (
        <Badge variant="outline">{row.permissions?.length || 0} permissions</Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              navigate(`/rbac/roles/${row.id}`)
            }}
            className="h-8 w-8 p-0 transition-all duration-200 hover:scale-110 hover:bg-primary/10"
            title="View details"
          >
            <HiOutlineEye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              setEditingRole(row)
              editRoleForm.reset({
                name: row.name,
                description: row.description || '',
                isActive: row.isActive,
              })
            }}
            className="h-8 w-8 p-0 transition-all duration-200 hover:scale-110 hover:bg-primary/10"
            title="Edit role"
          >
            <HiOutlinePencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              setDeletingRole(row)
            }}
            className="h-8 w-8 p-0 transition-all duration-200 hover:scale-110 hover:bg-destructive/10"
            title="Delete role"
          >
            <HiOutlineTrash className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ]

  const handleCreateRole = (data: CreateRoleDto) => {
    createRoleMutation.mutate(data)
  }

  const handleUpdateRole = (data: UpdateRoleDto) => {
    updateRoleMutation.mutate(data)
  }

  const handleDeleteRole = () => {
    deleteRoleMutation.mutate()
  }

  const hasActiveFilters = !!(filters.search || filters.status !== 'all')

  const clearFilters = () => {
    setFilters({ page: 1, limit: 20, search: '', status: 'all' })
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Roles"
        description="Manage roles and permissions"
        actions={
          <Button 
            onClick={() => setIsCreateDialogOpen(true)}
            className="transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <HiOutlinePlus className="h-4 w-4 mr-2" />
            Create Role
          </Button>
        }
      />

      {/* Filters */}
      <Card className="border-border/50 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <HiOutlineFunnel className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Filters</h3>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="ml-auto h-7 text-xs transition-all duration-200 hover:scale-105"
              >
                Clear all
              </Button>
            )}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Search</Label>
              <Input
                placeholder="Search by name or description"
                value={filters.search}
                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value, page: 1 }))}
                className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Status</Label>
              <Select
                value={filters.status}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, status: value as 'all' | 'active' | 'inactive', page: 1 }))
                }
              >
                <SelectTrigger className="transition-all duration-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader size="sm" text="Loading roles..." />
        </div>
      ) : (
        <DataTable
          data={filteredData}
          columns={columns}
          serverSidePagination={false}
          totalItems={filteredData.length}
          currentPage={filters.page}
          onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
          pageSize={filters.limit}
          refreshable={true}
          onRefresh={() => refetch()}
          isRefreshing={isFetching}
          onRowClick={(row) => navigate(`/rbac/roles/${row.id}`)}
          emptyStateTitle="No roles found"
          emptyStateDescription="Try adjusting your filters or create a new role."
          onClearFilters={clearFilters}
          hasFilters={hasActiveFilters}
        />
      )}

      {/* Create Role Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px] shadow-xl border-2">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-2xl font-bold">Create Role</DialogTitle>
            <DialogDescription className="text-base">Add a new role to the system.</DialogDescription>
          </DialogHeader>
            <form
              onSubmit={createRoleForm.handleSubmit(handleCreateRole)}
              className="space-y-5"
            >
              <FieldGroup>
                <Field className="space-y-2">
                  <FieldLabel htmlFor="create-role-name" className="text-sm font-medium">Role Name</FieldLabel>
                  <Controller
                    control={createRoleForm.control}
                    name="name"
                    render={({ field, fieldState }) => (
                      <>
                        <Input
                          {...field}
                          id="create-role-name"
                          placeholder="e.g., Admin, Manager, Viewer"
                          aria-invalid={fieldState.invalid}
                          className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                        />
                        <FieldError errors={fieldState.error ? [fieldState.error] : undefined} className="animate-in fade-in slide-in-from-top-1" />
                      </>
                    )}
                  />
                </Field>

                <Field className="space-y-2">
                  <FieldLabel htmlFor="create-role-description" className="text-sm font-medium">Description</FieldLabel>
                  <Controller
                    control={createRoleForm.control}
                    name="description"
                    render={({ field, fieldState }) => (
                      <>
                        <Textarea
                          {...field}
                          id="create-role-description"
                          placeholder="Optional description of the role"
                          aria-invalid={fieldState.invalid}
                          className="transition-all duration-200 focus:ring-2 focus:ring-primary/20 min-h-[100px]"
                        />
                        <FieldError errors={fieldState.error ? [fieldState.error] : undefined} className="animate-in fade-in slide-in-from-top-1" />
                      </>
                    )}
                  />
                </Field>

                <Field orientation="horizontal" className="p-3 rounded-lg bg-muted/30">
                  <Controller
                    control={createRoleForm.control}
                    name="isActive"
                    render={({ field }) => (
                      <Checkbox
                        id="create-role-active"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="transition-all duration-200"
                      />
                    )}
                  />
                  <FieldLabel htmlFor="create-role-active" className="cursor-pointer text-sm font-normal">
                    Active
                  </FieldLabel>
                </Field>
              </FieldGroup>

            <DialogFooter className="gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false)
                  createRoleForm.reset()
                }}
                className="transition-all duration-200 hover:scale-105 active:scale-95"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createRoleMutation.isPending}
                className="transition-all duration-200 hover:scale-105 active:scale-95"
              >
                {createRoleMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Creating...
                  </span>
                ) : (
                  'Create Role'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={!!editingRole} onOpenChange={(open) => !open && setEditingRole(null)}>
        <DialogContent className="sm:max-w-[500px] shadow-xl border-2">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-2xl font-bold">Edit Role</DialogTitle>
            <DialogDescription className="text-base">Update role information.</DialogDescription>
          </DialogHeader>
            <form
              onSubmit={editRoleForm.handleSubmit(handleUpdateRole)}
              className="space-y-5"
            >
              <FieldGroup>
                <Field className="space-y-2">
                  <FieldLabel htmlFor="edit-role-name" className="text-sm font-medium">Role Name</FieldLabel>
                  <Controller
                    control={editRoleForm.control}
                    name="name"
                    render={({ field, fieldState }) => (
                      <>
                        <Input
                          {...field}
                          id="edit-role-name"
                          placeholder="e.g., Admin, Manager, Viewer"
                          aria-invalid={fieldState.invalid}
                          className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                        />
                        <FieldError errors={fieldState.error ? [fieldState.error] : undefined} className="animate-in fade-in slide-in-from-top-1" />
                      </>
                    )}
                  />
                </Field>

                <Field className="space-y-2">
                  <FieldLabel htmlFor="edit-role-description" className="text-sm font-medium">Description</FieldLabel>
                  <Controller
                    control={editRoleForm.control}
                    name="description"
                    render={({ field, fieldState }) => (
                      <>
                        <Textarea
                          {...field}
                          id="edit-role-description"
                          placeholder="Optional description of the role"
                          aria-invalid={fieldState.invalid}
                          className="transition-all duration-200 focus:ring-2 focus:ring-primary/20 min-h-[100px]"
                        />
                        <FieldError errors={fieldState.error ? [fieldState.error] : undefined} className="animate-in fade-in slide-in-from-top-1" />
                      </>
                    )}
                  />
                </Field>

                <Field orientation="horizontal" className="p-3 rounded-lg bg-muted/30">
                  <Controller
                    control={editRoleForm.control}
                    name="isActive"
                    render={({ field }) => (
                      <Checkbox
                        id="edit-role-active"
                        checked={field.value ?? true}
                        onCheckedChange={field.onChange}
                        className="transition-all duration-200"
                      />
                    )}
                  />
                  <FieldLabel htmlFor="edit-role-active" className="cursor-pointer text-sm font-normal">
                    Active
                  </FieldLabel>
                </Field>
              </FieldGroup>

            <DialogFooter className="gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditingRole(null)
                  editRoleForm.reset()
                }}
                className="transition-all duration-200 hover:scale-105 active:scale-95"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={updateRoleMutation.isPending}
                className="transition-all duration-200 hover:scale-105 active:scale-95"
              >
                {updateRoleMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Updating...
                  </span>
                ) : (
                  'Update Role'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Role Confirmation Dialog */}
      <AlertDialog open={!!deletingRole} onOpenChange={(open) => !open && setDeletingRole(null)}>
        <AlertDialogContent className="shadow-xl border-2">
          <AlertDialogHeader className="space-y-2">
            <AlertDialogTitle className="text-2xl font-bold">Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              This will permanently delete the role &quot;<span className="font-semibold">{deletingRole?.name}</span>&quot;. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 pt-4">
            <AlertDialogCancel className="transition-all duration-200 hover:scale-105 active:scale-95">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRole}
              className="bg-destructive hover:bg-destructive/90 transition-all duration-200 hover:scale-105 active:scale-95"
              disabled={deleteRoleMutation.isPending}
            >
              {deleteRoleMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Deleting...
                </span>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

