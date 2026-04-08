import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { DataTable, Column } from '@/components/tables/DataTable'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { usersApi } from '@/api/endpoints/users/users'
import { User, UserFilter } from '@/types/user/users'
import { isPermissionError, handleApiError } from '@/lib/errorHandler'
import { PermissionError } from '@/components/misc/PermissionError'
import { TableSkeleton } from '@/components/ui/skeleton-loaders'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { HiOutlineEye, HiOutlinePencil, HiOutlineMagnifyingGlass } from 'react-icons/hi2'

export default function UsersPage() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState<UserFilter>({
    page: 1,
    limit: 20,
  })
  const [search, setSearch] = useState('')

  const { data, isLoading, isFetching, refetch, error } = useQuery({
    queryKey: ['users', filters, search],
    queryFn: async () => {
      const params = { ...filters, search: search || undefined }
      return usersApi.listUsers(params)
    },
  })

  const columns: Column<User>[] = [
    {
      id: 'email',
      header: 'Email',
      accessorKey: 'email',
      sortable: true,
    },
    {
      id: 'name',
      header: 'Name',
      cell: (row) => (
        <span>
          {row.firstname || ''} {row.lastname || ''}
        </span>
      ),
    },
    {
      id: 'ref_id',
      header: 'Ref ID',
      accessorKey: 'ref_id',
    },
    {
      id: 'status',
      header: 'Status',
      cell: (row) => {
        const statusColors = {
          active: 'bg-green-100 text-green-800',
          suspended: 'bg-red-100 text-red-800',
          inactive: 'bg-gray-100 text-gray-800',
        }
        // Derive status from isActive and suspendedAt
        let status: string
        if (row.suspendedAt) {
          status = 'suspended'
        } else if (row.isActive !== undefined) {
          status = row.isActive ? 'active' : 'inactive'
        } else {
          status = 'unknown'
        }
        return (
          <Badge className={statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        )
      },
    },
    {
      id: 'country',
      header: 'Country',
      cell: (row) => {
        const countryCode = row.country?.toUpperCase();
        if (!countryCode) return 'N/A';
        // Convert country code to emoji flag
        const flag = countryCode
          .split('')
          .map((char) => String.fromCodePoint(char.charCodeAt(0) + 127397))
          .join('');
        return (
          <div className="flex items-center gap-2">
            <span className="text-base leading-none" title={countryCode}>{flag}</span>
            <span className="text-sm font-medium">{countryCode}</span>
          </div>
        )
      },
    },
    {
      id: 'verification',
      header: 'Verification',
      cell: (row) => {
        // Use verificationStatus if available, otherwise fall back to verification object
        if (row.verificationStatus && row.verificationStatus !== 'NONE') {
          return (
            <Badge variant="outline">
              {row.verificationStatus}
            </Badge>
          )
        }
        if (row.verification) {
          return (
            <Badge variant="outline">
              Level {row.verification.level} - {row.verification.status}
            </Badge>
          )
        }
        return <span className="text-muted-foreground">None</span>
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (row) => (
        <TooltipProvider>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    navigate(`/users/${row.id}`)
                  }}
                  className="h-8 w-8 p-0 transition-all duration-200 hover:scale-110 hover:bg-primary/10"
                >
                  <HiOutlineEye className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View details</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    navigate(`/users/${row.id}/edit`)
                  }}
                  className="h-8 w-8 p-0 transition-all duration-200 hover:scale-110 hover:bg-primary/10"
                >
                  <HiOutlinePencil className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Edit user</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      ),
    },
  ]

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }))
  }

  const clearFilters = () => {
    setFilters({ page: 1, limit: 20 })
    setSearch('')
  }

  const hasActiveFilters = !!(filters.status || filters.verified || filters.country || search)

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader title="Users" description="Manage user accounts" />

      {/* Filters (Condensed) */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end premium-card p-4 border-border/40">
        <div className="w-full sm:flex-1 space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Search</Label>
          <div className="relative">
            <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search by email, name, or ref_id"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setFilters((prev) => ({ ...prev, page: 1 }))
              }}
              className="pl-9 h-9 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
        <div className="w-full sm:w-[150px] space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</Label>
          <Select
            value={filters.status || 'all'}
            onValueChange={(value) =>
              setFilters((prev) => ({
                ...prev,
                status: value === 'all' ? undefined : (value as UserFilter['status']),
                page: 1,
              }))
            }
          >
            <SelectTrigger className="h-9 transition-all duration-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-full sm:w-[150px] space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Verification</Label>
          <Select
            value={filters.verified || 'all'}
            onValueChange={(value) =>
              setFilters((prev) => ({
                ...prev,
                verified: value === 'all' ? undefined : (value as UserFilter['verified']),
                page: 1,
              }))
            }
          >
            <SelectTrigger className="h-9 transition-all duration-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-full sm:w-[120px] space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Country</Label>
          <Input
            placeholder="e.g. NG"
            value={filters.country || ''}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                country: e.target.value || undefined,
                page: 1,
              }))
            }
            className="h-9 transition-all duration-200 focus:ring-2 focus:ring-primary/20 uppercase"
            maxLength={2}
          />
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-9 px-3 text-xs transition-all duration-200 hover:bg-destructive/10 hover:text-destructive shrink-0"
          >
            Clear all
          </Button>
        )}
      </div>

      {/* Check for permission errors */}
      {error && isPermissionError(error) ? (
        <PermissionError
          message={handleApiError(error)}
          variant="inline"
        />
      ) : isLoading && !data ? (
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
          onPageChange={handlePageChange}
          pageSize={filters.limit || 20}
          isLoading={isFetching}
          refreshable={true}
          onRefresh={() => refetch()}
          isRefreshing={isFetching}
          onRowClick={(row) => navigate(`/users/${row.id}`)}
          emptyStateTitle="No users found"
          emptyStateDescription="Try adjusting your filters or search terms."
          onClearFilters={clearFilters}
          hasFilters={hasActiveFilters}
        />
      )}
    </div>
  )
}

