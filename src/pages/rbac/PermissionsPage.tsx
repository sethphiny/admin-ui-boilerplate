import { useState } from 'react'
import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { DataTable, Column } from '@/components/tables/DataTable'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Field, FieldLabel, FieldError, FieldDescription, FieldGroup } from '@/components/ui/field'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { rbacApi } from '@/api/endpoints/rbac/rbac'
import { Permission, CreatePermissionDto } from '@/types/admin/rbac'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { showSuccessToast, showErrorToast } from '@/lib/errorHandler'
import Loader from '@/components/misc/Loader'
import { HiOutlinePlus, HiOutlineFunnel } from 'react-icons/hi2'
import { Card, CardContent } from '@/components/ui/card'

// Zod schema for create permission form
const createPermissionSchema = z.object({
  resource: z.string().min(1, 'Resource is required'),
  action: z.string().min(1, 'Action is required'),
  description: z.string().optional(),
})

export default function PermissionsPage() {
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState({ page: 1, limit: 20, search: '', resource: 'all', action: 'all' })
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['permissions', filters],
    queryFn: () => rbacApi.listPermissions({ page: filters.page, limit: filters.limit }),
  })

  // Get unique resources and actions from data
  const uniqueResources = React.useMemo(() => {
    if (!data?.data) return []
    const resources = new Set(data.data.map((p) => p.resource))
    return Array.from(resources).sort()
  }, [data?.data])

  const uniqueActions = React.useMemo(() => {
    if (!data?.data) return []
    const actions = new Set(data.data.map((p) => p.action))
    return Array.from(actions).sort()
  }, [data?.data])

  // Filter data client-side for search, resource, and action
  const filteredData = React.useMemo(() => {
    if (!data?.data) return []
    let result = [...data.data]

    // Filter by search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      result = result.filter(
        (perm) =>
          perm.resource.toLowerCase().includes(searchLower) ||
          perm.action.toLowerCase().includes(searchLower) ||
          perm.description?.toLowerCase().includes(searchLower) ||
          `${perm.resource}.${perm.action}`.toLowerCase().includes(searchLower)
      )
    }

    // Filter by resource
    if (filters.resource !== 'all') {
      result = result.filter((perm) => perm.resource === filters.resource)
    }

    // Filter by action
    if (filters.action !== 'all') {
      result = result.filter((perm) => perm.action === filters.action)
    }

    return result
  }, [data?.data, filters.search, filters.resource, filters.action])

  // Fetch resources and actions for the create form
  const {
    data: resourcesAndActions,
    isLoading: isLoadingResources,
    error: resourcesError,
    refetch: refetchResources,
  } = useQuery({
    queryKey: ['resources-actions'],
    queryFn: () => rbacApi.getResourcesAndActions(),
    retry: false,
  })

  // Create permission form
  const createPermissionForm = useForm<CreatePermissionDto>({
    resolver: zodResolver(createPermissionSchema),
    defaultValues: {
      resource: '',
      action: '',
      description: '',
    },
  })

  // Create permission mutation
  const createPermissionMutation = useMutation({
    mutationFn: (data: CreatePermissionDto) => rbacApi.createPermission(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] })
      queryClient.invalidateQueries({ queryKey: ['resources-actions'] })
      setIsCreateDialogOpen(false)
      createPermissionForm.reset()
      showSuccessToast('Permission created successfully')
    },
    onError: (error) => {
      showErrorToast(error)
    },
  })

  // Resource-action grouping for filtering actions by resource (only uncreated permissions)
  const resourceActionMap = React.useMemo(() => {
    if (!resourcesAndActions) return new Map<string, string[]>()
    
    const map = new Map<string, string[]>()
    // Only include permissions that are NOT yet created
    resourcesAndActions.permissions
      .filter((perm) => !perm.isCreated)
      .forEach((perm) => {
        if (!map.has(perm.resource)) {
          map.set(perm.resource, [])
        }
        const actions = map.get(perm.resource)!
        if (!actions.includes(perm.action)) {
          actions.push(perm.action)
        }
      })
    return map
  }, [resourcesAndActions])

  // Get available actions for selected resource (only uncreated permissions)
  const availableActions = React.useMemo(() => {
    const selectedResource = createPermissionForm.watch('resource')
    if (!selectedResource || !resourcesAndActions) {
      // Return all unique actions from uncreated permissions
      const uncreatedActions = new Set<string>()
      resourcesAndActions?.permissions
        .filter((perm) => !perm.isCreated)
        .forEach((perm) => uncreatedActions.add(perm.action))
      return Array.from(uncreatedActions)
    }
    // Return actions for selected resource that are NOT yet created
    return resourceActionMap.get(selectedResource) || []
  }, [createPermissionForm.watch('resource'), resourceActionMap, resourcesAndActions])

  // Permission preview
  const permissionPreview = React.useMemo(() => {
    const resource = createPermissionForm.watch('resource')
    const action = createPermissionForm.watch('action')
    if (resource && action) {
      return `${resource}.${action}`
    }
    return null
  }, [createPermissionForm.watch('resource'), createPermissionForm.watch('action')])

  const columns: Column<Permission>[] = [
    {
      id: 'permission',
      header: 'Permission',
      cell: (row) => (
        <span className="font-mono text-sm">{row.resource}.{row.action}</span>
      ),
    },
    {
      id: 'resource',
      header: 'Resource',
      cell: (row) => (
        <Badge variant="outline" className="capitalize">
          {row.resource}
        </Badge>
      ),
    },
    {
      id: 'action',
      header: 'Action',
      cell: (row) => (
        <Badge variant="secondary" className="capitalize">
          {row.action}
        </Badge>
      ),
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
  ]

  const handleCreatePermission = (data: CreatePermissionDto) => {
    createPermissionMutation.mutate(data)
  }

  const hasActiveFilters = !!(filters.search || filters.resource !== 'all' || filters.action !== 'all')

  const clearFilters = () => {
    setFilters({ page: 1, limit: 20, search: '', resource: 'all', action: 'all' })
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Permissions"
        description="Manage permissions"
        actions={
          <Button 
            onClick={() => setIsCreateDialogOpen(true)}
            className="transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <HiOutlinePlus className="h-4 w-4 mr-2" />
            Create Permission
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
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Search</Label>
              <Input
                placeholder="Search by resource, action, or description"
                value={filters.search}
                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value, page: 1 }))}
                className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Resource</Label>
              <Select
                value={filters.resource}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, resource: value, page: 1 }))
                }
              >
                <SelectTrigger className="transition-all duration-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Resources</SelectItem>
                  {uniqueResources.map((resource) => (
                    <SelectItem key={resource} value={resource}>
                      {resource}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Action</Label>
              <Select
                value={filters.action}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, action: value, page: 1 }))
                }
              >
                <SelectTrigger className="transition-all duration-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {uniqueActions.map((action) => (
                    <SelectItem key={action} value={action}>
                      {action}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader size="sm" text="Loading permissions..." />
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
          emptyStateTitle="No permissions found"
          emptyStateDescription="Try adjusting your filters or create a new permission."
          onClearFilters={clearFilters}
          hasFilters={hasActiveFilters}
        />
      )}

      {/* Create Permission Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px] shadow-xl border-2">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-2xl font-bold">Create Permission</DialogTitle>
            <DialogDescription className="text-base">Add a new permission to the system.</DialogDescription>
          </DialogHeader>

          {isLoadingResources ? (
            <div className="flex items-center justify-center py-8">
              <Loader size="sm" text="Loading resources and actions..." />
            </div>
          ) : resourcesError ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded">
              <p className="text-sm text-red-800 mb-2">Failed to load resources and actions.</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => refetchResources()}
              >
                Retry
              </Button>
            </div>
          ) : (
              <form
                onSubmit={createPermissionForm.handleSubmit(handleCreatePermission)}
                className="space-y-5"
              >
                <FieldGroup>
                  <Field className="space-y-2">
                    <FieldLabel htmlFor="permission-resource" className="text-sm font-medium">Resource</FieldLabel>
                    <Controller
                      control={createPermissionForm.control}
                      name="resource"
                      render={({ field, fieldState }) => (
                        <>
                          <Select
                            value={field.value}
                            onValueChange={(value) => {
                              field.onChange(value)
                              createPermissionForm.setValue('action', '') // Reset action when resource changes
                            }}
                          >
                            <SelectTrigger id="permission-resource" aria-invalid={fieldState.invalid} className="transition-all duration-200">
                              <SelectValue placeholder="Select a resource" />
                            </SelectTrigger>
                            <SelectContent>
                              {resourcesAndActions?.resources.map((resource) => (
                                <SelectItem key={resource} value={resource}>
                                  {resource}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FieldDescription className="text-xs">
                            Select the resource this permission applies to
                          </FieldDescription>
                          <FieldError errors={fieldState.error ? [fieldState.error] : undefined} className="animate-in fade-in slide-in-from-top-1" />
                        </>
                      )}
                    />
                  </Field>

                  <Field className="space-y-2">
                    <FieldLabel htmlFor="permission-action" className="text-sm font-medium">Action</FieldLabel>
                    <Controller
                      control={createPermissionForm.control}
                      name="action"
                      render={({ field, fieldState }) => (
                        <>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                            disabled={!createPermissionForm.watch('resource')}
                          >
                            <SelectTrigger id="permission-action" aria-invalid={fieldState.invalid} className="transition-all duration-200">
                              <SelectValue
                                placeholder={
                                  createPermissionForm.watch('resource')
                                    ? 'Select an action'
                                    : 'Select a resource first'
                                }
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {availableActions.map((action) => (
                                <SelectItem key={action} value={action}>
                                  {action}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {createPermissionForm.watch('resource') && (
                            <FieldDescription className="text-xs">
                              {availableActions.length} action(s) available for &quot;{createPermissionForm.watch('resource')}&quot;
                            </FieldDescription>
                          )}
                          <FieldError errors={fieldState.error ? [fieldState.error] : undefined} className="animate-in fade-in slide-in-from-top-1" />
                        </>
                      )}
                    />
                  </Field>

                  {/* Permission Preview */}
                  {permissionPreview && (
                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                      <p className="text-sm font-semibold text-primary mb-1">Permission Name:</p>
                      <p className="text-sm text-foreground font-mono font-medium">{permissionPreview}</p>
                    </div>
                  )}

                  <Field className="space-y-2">
                    <FieldLabel htmlFor="permission-description" className="text-sm font-medium">Description</FieldLabel>
                    <Controller
                      control={createPermissionForm.control}
                      name="description"
                      render={({ field, fieldState }) => (
                        <>
                          <Textarea
                            {...field}
                            id="permission-description"
                            placeholder="Optional description of the permission"
                            aria-invalid={fieldState.invalid}
                            className="transition-all duration-200 focus:ring-2 focus:ring-primary/20 min-h-[100px]"
                          />
                          <FieldError errors={fieldState.error ? [fieldState.error] : undefined} className="animate-in fade-in slide-in-from-top-1" />
                        </>
                      )}
                    />
                  </Field>
                </FieldGroup>

              <DialogFooter className="gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false)
                    createPermissionForm.reset()
                  }}
                  className="transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createPermissionMutation.isPending || !createPermissionForm.watch('resource') || !createPermissionForm.watch('action')}
                  className="transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  {createPermissionMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Creating...
                    </span>
                  ) : (
                    'Create Permission'
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

