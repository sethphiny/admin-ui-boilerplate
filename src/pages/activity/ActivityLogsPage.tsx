import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { DataTable, Column } from '@/components/tables/DataTable'
import { PageHeader } from '@/components/layout/PageHeader'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { activityApi } from '@/api/endpoints/activity/activity'
import { ActivityLog, ActivityLogFilter } from '@/types/user/activity'
import Loader from '@/components/misc/Loader'
import { HiOutlineEye } from 'react-icons/hi2'
import { formatDateTime } from '@/lib/dateUtils'

export default function ActivityLogsPage() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState<ActivityLogFilter>({
    page: 1,
    limit: 20,
  })
  const [activeTab, setActiveTab] = useState<'user' | 'admin' | 'graphql'>('user')

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['activity-logs', filters, activeTab],
    queryFn: () => {
      if (activeTab === 'admin') {
        return activityApi.listAdminActivityLogs(filters)
      }
      if (activeTab === 'graphql') {
        return activityApi.listGraphQLActivityLogs(filters)
      }
      return activityApi.listActivityLogs(filters)
    },
  })

  const formatDate = (dateString: string | undefined | null): string => {
    if (!dateString) return 'N/A'
    return formatDateTime(dateString, { second: '2-digit' })
  }

  const getOperationTypeBadge = (operationType: string | null | undefined) => {
    if (!operationType) return null
    const colors = {
      QUERY: 'bg-blue-100 text-blue-800',
      MUTATION: 'bg-orange-100 text-orange-800',
      SUBSCRIPTION: 'bg-purple-100 text-purple-800',
    }
    const colorClass = colors[operationType as keyof typeof colors] || 'bg-gray-100 text-gray-800'
    return <Badge className={colorClass}>{operationType}</Badge>
  }

  const formatResolverPath = (path: string[] | null | undefined): string => {
    if (!path || path.length === 0) return '-'
    return path.join(' → ')
  }

  // Base columns for all tabs
  const baseColumns: Column<ActivityLog>[] = [
    {
      id: 'userEmail',
      header: 'User',
      cell: (row) => (
        <div>
          {row.userEmail ? (
            <div>
              <p className="text-sm font-medium">{row.userEmail}</p>
              {row.userId && (
                <p className="text-xs text-muted-foreground font-mono">{row.userId.substring(0, 8)}...</p>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </div>
      ),
    },
    {
      id: 'action',
      header: 'Action',
      cell: (row) => (
        <Badge variant="outline" className="font-mono text-xs">
          {row.action}
        </Badge>
      ),
    },
    {
      id: 'endpoint',
      header: 'Endpoint',
      cell: (row) => (
        <div>
          <Badge variant="secondary" className="text-xs mr-1">
            {row.method}
          </Badge>
          <span className="text-sm font-mono">{row.endpoint}</span>
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: (row) => (
        <Badge className={row.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
          {row.status.toUpperCase()}
        </Badge>
      ),
    },
    {
      id: 'executionTime',
      header: 'Execution Time',
      cell: (row) => (
        <span className="text-sm text-muted-foreground">
          {row.executionTime !== undefined ? `${row.executionTime}ms` : '-'}
        </span>
      ),
    },
    {
      id: 'createdAt',
      header: 'Date',
      cell: (row) => (
        <span className="text-sm">{formatDate(row.createdAt)}</span>
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
            navigate(`/activity/${activeTab}/${row.id}`)
          }}
        >
          <HiOutlineEye className="h-4 w-4" />
        </Button>
      ),
    },
  ]

  // GraphQL-specific columns
  const graphqlColumns: Column<ActivityLog>[] = [
    {
      id: 'operationName',
      header: 'Operation Name',
      cell: (row) => (
        <div>
          {row.operationName ? (
            <Badge variant="outline" className="font-mono text-xs">
              {row.operationName}
            </Badge>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </div>
      ),
    },
    {
      id: 'operationType',
      header: 'Operation Type',
      cell: (row) => getOperationTypeBadge(row.operationType),
    },
    {
      id: 'resolverPath',
      header: 'Resolver Path',
      cell: (row) => (
        <span className="text-sm font-mono text-muted-foreground">
          {formatResolverPath(row.resolverPath)}
        </span>
      ),
    },
    {
      id: 'userEmail',
      header: 'User',
      cell: (row) => (
        <div>
          {row.userEmail ? (
            <div>
              <p className="text-sm font-medium">{row.userEmail}</p>
              {row.userId && (
                <p className="text-xs text-muted-foreground font-mono">{row.userId.substring(0, 8)}...</p>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: (row) => (
        <Badge className={row.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
          {row.status.toUpperCase()}
        </Badge>
      ),
    },
    {
      id: 'executionTime',
      header: 'Execution Time',
      cell: (row) => (
        <span className="text-sm text-muted-foreground">
          {row.executionTime !== undefined ? `${row.executionTime}ms` : '-'}
        </span>
      ),
    },
    {
      id: 'createdAt',
      header: 'Date',
      cell: (row) => (
        <span className="text-sm">{formatDate(row.createdAt)}</span>
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
            navigate(`/activity/${activeTab}/${row.id}`)
          }}
        >
          <HiOutlineEye className="h-4 w-4" />
        </Button>
      ),
    },
  ]

  // Determine which columns to use based on active tab
  const columns = useMemo(() => {
    if (activeTab === 'graphql') {
      return graphqlColumns
    }
    // For user/admin tabs, show base columns but add GraphQL info if available
    return baseColumns.map((col) => {
      if (col.id === 'action') {
        return {
          ...col,
          cell: (row: ActivityLog) => (
            <div className="space-y-1">
              <Badge variant="outline" className="font-mono text-xs">
                {row.action}
              </Badge>
              {row.operationName && (
                <div className="flex items-center gap-1">
                  {getOperationTypeBadge(row.operationType)}
                  <span className="text-xs text-muted-foreground">{row.operationName}</span>
                </div>
              )}
            </div>
          ),
        }
      }
      return col
    })
  }, [activeTab])

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 20,
    })
  }

  const hasFilters = !!(
    filters.operationName ||
    filters.operationType ||
    filters.resolverPath ||
    filters.graphqlOnly ||
    filters.startDate ||
    filters.endDate ||
    filters.action ||
    filters.status ||
    filters.userId ||
    filters.ipAddress
  )

  return (
    <div className="space-y-6">
      <PageHeader title="Activity Logs" description="View system activity logs" />

      <Tabs value={activeTab} onValueChange={(v) => {
        setActiveTab(v as typeof activeTab)
        // Reset filters when switching tabs
        setFilters((prev) => ({ ...prev, page: 1 }))
      }}>
        <TabsList>
          <TabsTrigger value="user">User Logs</TabsTrigger>
          <TabsTrigger value="admin">Admin Logs</TabsTrigger>
          <TabsTrigger value="graphql">GraphQL Logs</TabsTrigger>
        </TabsList>
        <TabsContent value={activeTab} className="space-y-4">
          {/* Filters */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* GraphQL-specific filters */}
            {(activeTab === 'graphql' || filters.graphqlOnly) && (
              <>
                <div className="space-y-2">
                  <Label>Operation Type</Label>
                  <Select
                    value={filters.operationType || 'all'}
                    onValueChange={(value) =>
                      setFilters((prev) => ({
                        ...prev,
                        operationType: value === 'all' ? undefined : (value as ActivityLogFilter['operationType']),
                        page: 1,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="QUERY">Query</SelectItem>
                      <SelectItem value="MUTATION">Mutation</SelectItem>
                      <SelectItem value="SUBSCRIPTION">Subscription</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Operation Name</Label>
                  <Input
                    placeholder="e.g., GetWallets"
                    value={filters.operationName || ''}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        operationName: e.target.value || undefined,
                        page: 1,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Resolver Path</Label>
                  <Input
                    placeholder="e.g., getWallets,wallet"
                    value={filters.resolverPath || ''}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        resolverPath: e.target.value || undefined,
                        page: 1,
                      }))
                    }
                  />
                </div>
              </>
            )}

            {/* Common filters */}
            <div className="space-y-2">
              <Label>Action</Label>
              <Input
                placeholder="Filter by action"
                value={filters.action || ''}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    action: e.target.value || undefined,
                    page: 1,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={filters.status || 'all'}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    status: value === 'all' ? undefined : value,
                    page: 1,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="SUCCESS">Success</SelectItem>
                  <SelectItem value="FAILURE">Failure</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="datetime-local"
                value={filters.startDate ? new Date(filters.startDate).toISOString().slice(0, 16) : ''}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    startDate: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                    page: 1,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="datetime-local"
                value={filters.endDate ? new Date(filters.endDate).toISOString().slice(0, 16) : ''}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    endDate: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                    page: 1,
                  }))
                }
              />
            </div>

            {/* GraphQL Only checkbox for user/admin tabs */}
            {activeTab !== 'graphql' && (
              <div className="flex items-center space-x-2 pt-8">
                <Checkbox
                  id="graphqlOnly"
                  checked={filters.graphqlOnly || false}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      graphqlOnly: (e.target as HTMLInputElement).checked || undefined,
                      page: 1,
                    }))
                  }
                />
                <Label htmlFor="graphqlOnly" className="cursor-pointer">
                  GraphQL Only
                </Label>
              </div>
            )}

            {/* Clear filters button */}
            {hasFilters && (
              <div className="flex items-end">
                <Button variant="outline" onClick={clearFilters} className="w-full">
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader size="sm" />
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
              onRowClick={(row) => navigate(`/activity/${activeTab}/${row.id}`)}
              emptyStateTitle="No activity logs found"
              emptyStateDescription="Try adjusting your filters or check back later."
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

