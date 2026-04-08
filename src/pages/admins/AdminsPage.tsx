import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { DataTable, Column } from '@/components/tables/DataTable'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { PasswordInput } from '@/components/forms/PasswordInput'
import { adminsApi } from '@/api/endpoints/admins/admins'
import { rbacApi } from '@/api/endpoints/rbac/rbac'
import { Admin, AdminFilter, CreateAdminDto } from '@/types/admin/admins'
import { Badge } from '@/components/ui/badge'
import { PermissionError } from '@/components/misc/PermissionError'
import { TableSkeleton } from '@/components/ui/skeleton-loaders'
import { isPermissionError, handleApiError, showSuccessToast, showErrorToast } from '@/lib/errorHandler'
import { HiOutlineEye, HiOutlinePlus } from 'react-icons/hi2'

// Zod schema for create admin form
const createAdminSchema = z.object({
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstname: z.string().min(1, 'First name is required'),
  lastname: z.string().min(1, 'Last name is required'),
  roleId: z.string().min(1, 'Role is required'),
})

export default function AdminsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState<AdminFilter>({
    page: 1,
    limit: 20,
  })
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  const { data, isLoading, refetch, isFetching, error } = useQuery({
    queryKey: ['admins', filters],
    queryFn: () => adminsApi.listAdmins(filters),
  })

  // Fetch roles for the create form
  const { data: rolesData, error: rolesError } = useQuery({
    queryKey: ['roles'],
    queryFn: () => rbacApi.listRoles({ limit: 100 }),
    retry: false,
  })

  // Create admin form
  const createAdminForm = useForm<CreateAdminDto>({
    resolver: zodResolver(createAdminSchema),
    defaultValues: {
      email: '',
      password: '',
      firstname: '',
      lastname: '',
      roleId: '',
    },
  })

  // Create admin mutation
  const createAdminMutation = useMutation({
    mutationFn: (data: CreateAdminDto) => adminsApi.createAdmin(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] })
      setIsCreateDialogOpen(false)
      createAdminForm.reset()
      showSuccessToast('Admin created successfully')
    },
    onError: (error) => {
      showErrorToast(error)
    },
  })

  const columns: Column<Admin>[] = [
    {
      id: 'email',
      header: 'Email',
      accessorKey: 'email',
    },
    {
      id: 'name',
      header: 'Name',
      cell: (row) => `${row.firstname} ${row.lastname}`,
    },
    {
      id: 'role',
      header: 'Role',
      cell: (row) => row.role.name,
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
      id: 'actions',
      header: 'Actions',
      cell: (row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            navigate(`/admins/${row.id}`)
          }}
          className="h-8 w-8 p-0 transition-all duration-200 hover:scale-110 hover:bg-primary/10"
          title="View details"
        >
          <HiOutlineEye className="h-4 w-4" />
        </Button>
      ),
    },
  ]

  const handleCreateAdmin = (data: CreateAdminDto) => {
    createAdminMutation.mutate(data)
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Admins"
        description="Manage admin users"
        actions={
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <HiOutlinePlus className="h-4 w-4 mr-2" />
            Create Admin
          </Button>
        }
      />

      {/* Check for permission errors */}
      {error && isPermissionError(error) ? (
        <PermissionError message={handleApiError(error)} variant="inline" />
      ) : isLoading ? (
        <div className="py-6">
          <TableSkeleton />
        </div>
      ) : (
        <DataTable
          data={data?.data || []}
          columns={columns}
          serverSidePagination={true}
          totalItems={data?.meta?.total || 0}
          currentPage={filters.page || 1}
          onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
          pageSize={filters.limit || 20}
          refreshable={true}
          onRefresh={() => refetch()}
          isRefreshing={isFetching}
          onRowClick={(row) => navigate(`/admins/${row.id}`)}
        />
      )}

      {/* Create Admin Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px] shadow-xl border-2">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-2xl font-bold">Create Admin</DialogTitle>
            <DialogDescription className="text-base">Add a new admin user to the system.</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={createAdminForm.handleSubmit(handleCreateAdmin)}
            className="space-y-5"
          >
            <FieldGroup>
              <Field className="space-y-2">
                <FieldLabel htmlFor="email" className="text-sm font-medium">Email</FieldLabel>
                <Controller
                  control={createAdminForm.control}
                  name="email"
                  render={({ field, fieldState }) => (
                    <>
                      <Input
                        {...field}
                        id="email"
                        type="email"
                        placeholder="admin@example.com"
                        aria-invalid={fieldState.invalid}
                        className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                      />
                      <FieldError errors={fieldState.error ? [fieldState.error] : undefined} className="animate-in fade-in slide-in-from-top-1" />
                    </>
                  )}
                />
              </Field>

              <Field className="space-y-2">
                <FieldLabel htmlFor="password" className="text-sm font-medium">Password</FieldLabel>
                <Controller
                  control={createAdminForm.control}
                  name="password"
                  render={({ field, fieldState }) => (
                    <>
                      <PasswordInput
                        {...field}
                        id="password"
                        placeholder="Enter password"
                        aria-invalid={fieldState.invalid}
                        className="transition-all duration-200 focus-within:ring-2 focus-within:ring-primary/20"
                      />
                      <FieldError errors={fieldState.error ? [fieldState.error] : undefined} className="animate-in fade-in slide-in-from-top-1" />
                    </>
                  )}
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field className="space-y-2">
                  <FieldLabel htmlFor="firstname" className="text-sm font-medium">First Name</FieldLabel>
                  <Controller
                    control={createAdminForm.control}
                    name="firstname"
                    render={({ field, fieldState }) => (
                      <>
                        <Input
                          {...field}
                          id="firstname"
                          placeholder="John"
                          aria-invalid={fieldState.invalid}
                          className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                        />
                        <FieldError errors={fieldState.error ? [fieldState.error] : undefined} className="animate-in fade-in slide-in-from-top-1" />
                      </>
                    )}
                  />
                </Field>

                <Field className="space-y-2">
                  <FieldLabel htmlFor="lastname" className="text-sm font-medium">Last Name</FieldLabel>
                  <Controller
                    control={createAdminForm.control}
                    name="lastname"
                    render={({ field, fieldState }) => (
                      <>
                        <Input
                          {...field}
                          id="lastname"
                          placeholder="Doe"
                          aria-invalid={fieldState.invalid}
                          className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                        />
                        <FieldError errors={fieldState.error ? [fieldState.error] : undefined} className="animate-in fade-in slide-in-from-top-1" />
                      </>
                    )}
                  />
                </Field>
              </div>

              <Field className="space-y-2">
                <FieldLabel htmlFor="roleId" className="text-sm font-medium">Role</FieldLabel>
                <Controller
                  control={createAdminForm.control}
                  name="roleId"
                  render={({ field, fieldState }) => (
                    <>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger id="roleId" aria-invalid={fieldState.invalid} className="transition-all duration-200">
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                          {rolesError ? (
                            <SelectItem value="" disabled>
                              Unable to load roles
                            </SelectItem>
                          ) : rolesData?.data?.length === 0 ? (
                            <SelectItem value="" disabled>
                              No roles available
                            </SelectItem>
                          ) : (
                            rolesData?.data?.map((role) => (
                              <SelectItem key={role.id} value={role.id}>
                                {role.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
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
                  createAdminForm.reset()
                }}
                className="transition-all duration-200 hover:scale-105 active:scale-95"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createAdminMutation.isPending}
                className="transition-all duration-200 hover:scale-105 active:scale-95"
              >
                {createAdminMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Creating...
                  </span>
                ) : (
                  'Create Admin'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

