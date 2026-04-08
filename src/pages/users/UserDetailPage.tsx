import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DataTable } from '@/components/tables/DataTable'
import { usersApi } from '@/api/endpoints/users/users'
import type { PaginatedResponse } from '@/types/api/api'
import type { Transaction } from '@/types/financial/transactions'
import type { Payment } from '@/types/financial/payments'
import type { Swap } from '@/types/financial/swaps'
import type { ActivityLog } from '@/types/user/activity'
import Loader from '@/components/misc/Loader'
import { PermissionError } from '@/components/misc/PermissionError'
import { TransactionTypeBadge } from '@/components/misc/TransactionTypeBadge'
import { isPermissionError, handleApiError } from '@/lib/errorHandler'
import { formatDateTime } from '@/lib/dateUtils'
import { cn } from '@/lib/utils'
import { UserActions } from '@/components/users/UserActions'
import {
  HiOutlineArrowLeft,
  HiOutlineEye,
  HiOutlineWallet,
  HiOutlineChartBarSquare,
  HiOutlineCreditCard,
  HiOutlineShieldCheck,
} from 'react-icons/hi2'

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  // Pagination states for different tabs
  const [transactionFilters, setTransactionFilters] = useState({ page: 1, limit: 20 })
  const [paymentFilters, setPaymentFilters] = useState({ page: 1, limit: 20 })
  const [swapFilters, setSwapFilters] = useState({ page: 1, limit: 20 })
  const [activityFilters, setActivityFilters] = useState({ page: 1, limit: 20 })

  // Fetch user details
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['user', id],
    queryFn: () => usersApi.getUserById(id!),
    enabled: !!id,
  })

  // Fetch user wallets (non-paginated)
  const {
    data: wallets,
    isLoading: walletsLoading,
    refetch: refetchWallets,
    isFetching: walletsFetching,
  } = useQuery({
    queryKey: ['user-wallets', id],
    queryFn: () => usersApi.getUserWallets(id!),
    enabled: !!id,
  })

  // Fetch user transactions (paginated)
  const {
    data: transactions,
    isLoading: transactionsLoading,
    isFetching: transactionsFetching,
    refetch: refetchTransactions,
  } = useQuery<PaginatedResponse<Transaction>>({
    queryKey: ['user-transactions', id, transactionFilters],
    queryFn: () => usersApi.getUserTransactions(id!, transactionFilters),
    enabled: !!id,
  })

  // Fetch user payments (paginated)
  const {
    data: payments,
    isLoading: paymentsLoading,
    isFetching: paymentsFetching,
    refetch: refetchPayments,
  } = useQuery<PaginatedResponse<Payment>>({
    queryKey: ['user-payments', id, paymentFilters],
    queryFn: () => usersApi.getUserPayments(id!, paymentFilters),
    enabled: !!id,
  })

  // Fetch user swaps (paginated)
  const {
    data: swaps,
    isLoading: swapsLoading,
    isFetching: swapsFetching,
    refetch: refetchSwaps,
  } = useQuery<PaginatedResponse<Swap>>({
    queryKey: ['user-swaps', id, swapFilters],
    queryFn: () => usersApi.getUserSwaps(id!, swapFilters),
    enabled: !!id,
  })

  // Fetch user verification
  const {
    data: verification,
    isLoading: verificationLoading,
  } = useQuery({
    queryKey: ['user-verification', id],
    queryFn: () => usersApi.getUserVerification(id!),
    enabled: !!id,
  })

  // Fetch user activity logs (paginated)
  const {
    data: activityLogs,
    isLoading: activityLogsLoading,
    isFetching: activityLogsFetching,
    refetch: refetchActivityLogs,
  } = useQuery<PaginatedResponse<ActivityLog>>({
    queryKey: ['user-activity-logs', id, activityFilters],
    queryFn: () => usersApi.getUserActivityLogs(id!, activityFilters),
    enabled: !!id,
  })

  // Helper functions
  const formatNumber = (value: number | undefined | null): string => {
    if (value === undefined || value === null) return '0'
    return value.toLocaleString()
  }


  const getCategoryBadge = (category: string) => {
    const categoryConfig: Record<string, { label: string; className: string }> = {
      airtime: {
        label: 'Airtime',
        className: 'bg-slate-50 text-slate-700 border-slate-200',
      },
      data: {
        label: 'Data',
        className: 'bg-violet-50 text-violet-700 border-violet-200',
      },
      electricity: {
        label: 'Electricity',
        className: 'bg-amber-50 text-amber-700 border-amber-200',
      },
      water: {
        label: 'Water',
        className: 'bg-teal-50 text-teal-700 border-teal-200',
      },
      tv: {
        label: 'TV',
        className: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
      },
      internet: {
        label: 'Internet',
        className: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      },
      airline: {
        label: 'Airline',
        className: 'bg-blue-50 text-blue-700 border-blue-200',
      },
      giftcard: {
        label: 'Gift Card',
        className: 'bg-rose-50 text-rose-700 border-rose-200',
      },
      transport: {
        label: 'Transport',
        className: 'bg-green-50 text-green-700 border-green-200',
      },
      event: {
        label: 'Event',
        className: 'bg-orange-50 text-orange-700 border-orange-200',
      },
    }

    const config = categoryConfig[category?.toLowerCase()] || {
      label: category || 'Unknown',
      className: 'bg-gray-50 text-gray-600 border-gray-200',
    }

    return (
      <Badge variant="outline" className={`${config.className} font-medium text-xs`}>
        {config.label}
      </Badge>
    )
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
        onGoBack={() => navigate('/users')}
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
            <Button
              onClick={() => navigate('/users')}
              variant="outline"
              className="mt-4"
            >
              <HiOutlineArrowLeft className="h-4 w-4 mr-2" />
              Back to Users
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!user) {
    return <div>User not found</div>
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${user.firstname || ''} ${user.lastname || ''}`.trim() || user.email}
        description={user.email}
        actions={
          <Button variant="outline" onClick={() => navigate('/users')}>
            <HiOutlineArrowLeft className="h-4 w-4 mr-2" />
            Back to Users
          </Button>
        }
      />

      {/* User Actions */}
      <UserActions
        userId={user.id}
        userStatus={
          user.suspendedAt
            ? 'suspended'
            : user.isActive !== undefined
              ? (user.isActive ? 'active' : 'inactive')
              : 'inactive'
        }
        userEmail={user.email}
      />


      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="wallets">Wallets</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="swaps">Swaps</TabsTrigger>
          <TabsTrigger value="verification">Verification</TabsTrigger>
          <TabsTrigger value="activity">Activity Logs</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="md:col-span-2 lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Wallet Summary</CardTitle>
                <HiOutlineWallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="text-2xl font-bold">{formatNumber(user.walletSummary?.total || 0)}</div>
                      <p className="text-xs text-muted-foreground">Total Wallets</p>
                    </div>
                    <div className="h-12 w-px bg-border" />
                    <div>
                      <div className="text-lg font-semibold">{formatNumber(user.walletSummary?.crypto || 0)}</div>
                      <p className="text-xs text-muted-foreground">Crypto</p>
                    </div>
                    <div>
                      <div className="text-lg font-semibold">{formatNumber(user.walletSummary?.fiat || 0)}</div>
                      <p className="text-xs text-muted-foreground">Fiat</p>
                    </div>
                  </div>
                  {user.walletSummary?.totalBalance && Object.keys(user.walletSummary.totalBalance).length > 0 && (
                    <div className="space-y-2 pt-2 border-t">
                      <p className="text-xs font-medium text-muted-foreground">Total Balances</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(user.walletSummary.totalBalance).map(([currency, amount]) => (
                          <Badge key={currency} variant="outline" className="font-mono">
                            <span className="font-semibold mr-1">{currency}:</span>
                            <span>{typeof amount === 'number' ? amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 }) : amount}</span>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Transactions</CardTitle>
                <HiOutlineChartBarSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(user.transactionCount)}</div>
                <p className="text-xs text-muted-foreground">Total transactions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Loyalty Points</CardTitle>
                <HiOutlineCreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(user.loyaltyPoints)}</div>
                <p className="text-xs text-muted-foreground">Available points</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Verification Status</CardTitle>
                <HiOutlineShieldCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {!user.verificationStatus || user.verificationStatus === 'NONE' ? (
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-destructive" />
                      <span className="text-sm font-medium text-muted-foreground">Not Verified</span>
                    </div>
                  ) : (
                    <>
                      <Badge variant="outline" className={cn("text-sm", user.verificationStatus === 'APPROVED' && "bg-green-100 text-green-800 border-green-200")}>
                        {user.verificationStatus}
                      </Badge>
                      {user.verification && (
                        <p className="text-xs text-muted-foreground font-medium">Level {user.verification.level}</p>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Account Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(() => {
                  let status: string
                  if (user.suspendedAt) {
                    status = 'suspended'
                  } else if (user.isActive !== undefined) {
                    status = user.isActive ? 'active' : 'inactive'
                  } else {
                    status = 'unknown'
                  }
                  return (
                    <Badge
                      className={
                        status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : status === 'suspended'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                      }
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Badge>
                  )
                })()}
                {user.suspendedReason && (
                  <p className="text-sm text-muted-foreground mt-2">
                    <strong>Suspension Reason:</strong> {user.suspendedReason}
                  </p>
                )}
                {user.suspendedAt && (
                  <p className="text-xs text-muted-foreground">
                    Suspended on: {formatDateTime(user.suspendedAt)}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Email</p>
                    <p className="text-sm font-medium truncate" title={user.email}>{user.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Country</p>
                    <p className="text-sm font-medium">{user.country || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Reference ID</p>
                    <p className="text-sm font-mono truncate" title={user.ref_id}>{user.ref_id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Member Since</p>
                    <p className="text-sm font-medium">{formatDateTime(user.createdAt)}</p>
                  </div>
                </div>
                {user.settings && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm font-medium mb-2">Notification Settings</p>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">
                        Email: {user.settings.email_notification ? 'Enabled' : 'Disabled'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Phone: {user.settings.phone_notification ? 'Enabled' : 'Disabled'}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="wallets">
          {walletsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader size="sm" />
            </div>
          ) : (
            <DataTable
              data={wallets || []}
              columns={[
                {
                  id: 'symbol',
                  header: 'Currency',
                  accessorKey: 'symbol',
                },
                {
                  id: 'type',
                  header: 'Type',
                  cell: (row) => <Badge variant="outline">{row.type}</Badge>,
                },
                {
                  id: 'balance',
                  header: 'Balance',
                  cell: (row) => `${row.balance} ${row.symbol}`,
                },
                {
                  id: 'locked',
                  header: 'Locked',
                  cell: (row) => `${row.locked} ${row.symbol}`,
                },
                {
                  id: 'isFrozen',
                  header: 'Status',
                  cell: (row) => (
                    <Badge className={row.isFrozen ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                      {row.isFrozen ? 'Frozen' : 'Active'}
                    </Badge>
                  ),
                },
                {
                  id: 'actions',
                  header: 'Actions',
                  cell: (row) => (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/wallets/${row.id}`)
                      }}
                    >
                      <HiOutlineEye className="h-4 w-4" />
                    </button>
                  ),
                },
              ]}
              pagination={true}
              pageSize={20}
              refreshable={true}
              onRefresh={() => refetchWallets()}
              isRefreshing={walletsFetching}
              onRowClick={(row) => navigate(`/wallets/${row.id}`)}
              emptyStateTitle="No wallets found"
              emptyStateDescription="This user doesn't have any wallets yet."
            />
          )}
        </TabsContent>
        <TabsContent value="transactions">
          {transactionsLoading && !(transactions as PaginatedResponse<Transaction> | undefined)?.data ? (
            <div className="flex items-center justify-center py-12">
              <Loader size="sm" />
            </div>
          ) : (
            <DataTable
              data={(transactions as PaginatedResponse<Transaction> | undefined)?.data || []}
              isLoading={transactionsFetching}
              columns={[
                {
                  id: 'reference',
                  header: 'Reference',
                  accessorKey: 'reference',
                },
                {
                  id: 'type',
                  header: 'Type',
                  cell: (row) => <TransactionTypeBadge type={row.type} />,
                },
                {
                  id: 'amount',
                  header: 'Amount',
                  cell: (row) => `${row.amount} ${row.currency}`,
                },
                {
                  id: 'status',
                  header: 'Status',
                  cell: (row) => {
                    const statusColors: Record<string, string> = {
                      success: 'bg-green-100 text-green-800',
                      completed: 'bg-green-100 text-green-800',
                      failed: 'bg-red-100 text-red-800',
                      pending: 'bg-yellow-100 text-yellow-800',
                      cancelled: 'bg-gray-100 text-gray-800',
                    }
                    const colorClass = statusColors[row.status?.toLowerCase()] || 'bg-gray-100 text-gray-800'
                    return <Badge className={colorClass}>{row.status}</Badge>
                  },
                },
                {
                  id: 'createdAt',
                  header: 'Created',
                  cell: (row) => formatDateTime(row.createdAt),
                },
                {
                  id: 'actions',
                  header: 'Actions',
                  cell: (row) => (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/transactions/${row.id}`)
                      }}
                    >
                      <HiOutlineEye className="h-4 w-4" />
                    </button>
                  ),
                },
              ]}
              serverSidePagination={true}
              totalItems={transactions?.meta?.total || 0}
              currentPage={transactionFilters.page || 1}
              onPageChange={(page) => setTransactionFilters((prev) => ({ ...prev, page }))}
              pageSize={transactionFilters.limit || 20}
              refreshable={true}
              onRefresh={() => refetchTransactions()}
              isRefreshing={transactionsFetching}
              onRowClick={(row) => navigate(`/transactions/${row.id}`)}
              emptyStateTitle="No transactions found"
              emptyStateDescription="This user doesn't have any transactions yet."
            />
          )}
        </TabsContent>
        <TabsContent value="payments">
          {paymentsLoading && !(payments as PaginatedResponse<Payment> | undefined)?.data ? (
            <div className="flex items-center justify-center py-12">
              <Loader size="sm" />
            </div>
          ) : (
            <DataTable
              data={(payments as PaginatedResponse<Payment> | undefined)?.data || []}
              isLoading={paymentsFetching}
              columns={[
                {
                  id: 'ref',
                  header: 'Reference',
                  accessorKey: 'ref',
                },
                {
                  id: 'category',
                  header: 'Category',
                  cell: (row) => getCategoryBadge(row.category),
                },
                {
                  id: 'amount',
                  header: 'Amount',
                  cell: (row) => `${row.amount} ${row.currency}`,
                },
                {
                  id: 'status',
                  header: 'Status',
                  cell: (row) => {
                    const statusColors: Record<string, string> = {
                      success: 'bg-green-100 text-green-800',
                      completed: 'bg-green-100 text-green-800',
                      failed: 'bg-red-100 text-red-800',
                      pending: 'bg-yellow-100 text-yellow-800',
                      processing: 'bg-blue-100 text-blue-800',
                    }
                    const colorClass = statusColors[row.status?.toLowerCase()] || 'bg-gray-100 text-gray-800'
                    return <Badge className={colorClass}>{row.status}</Badge>
                  },
                },
                {
                  id: 'provider',
                  header: 'Provider',
                  accessorKey: 'provider',
                  cell: (row) => row.provider || 'N/A',
                },
                {
                  id: 'createdAt',
                  header: 'Created',
                  cell: (row) => formatDateTime(row.createdAt),
                },
                {
                  id: 'actions',
                  header: 'Actions',
                  cell: (row) => (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/payments/${row.id}`)
                      }}
                    >
                      <HiOutlineEye className="h-4 w-4" />
                    </button>
                  ),
                },
              ]}
              serverSidePagination={true}
              totalItems={payments?.meta?.total || 0}
              currentPage={paymentFilters.page || 1}
              onPageChange={(page) => setPaymentFilters((prev) => ({ ...prev, page }))}
              pageSize={paymentFilters.limit || 20}
              refreshable={true}
              onRefresh={() => refetchPayments()}
              isRefreshing={paymentsFetching}
              onRowClick={(row) => navigate(`/payments/${row.id}`)}
              emptyStateTitle="No payments found"
              emptyStateDescription="This user doesn't have any payments yet."
            />
          )}
        </TabsContent>
        <TabsContent value="swaps">
          {swapsLoading && !(swaps as PaginatedResponse<Swap> | undefined)?.data ? (
            <div className="flex items-center justify-center py-12">
              <Loader size="sm" />
            </div>
          ) : (
            <DataTable
              data={(swaps as PaginatedResponse<Swap> | undefined)?.data || []}
              isLoading={swapsFetching}
              columns={[
                {
                  id: 'fromCurrency',
                  header: 'From',
                  cell: (row) => `${row.fromAmount} ${row.fromCurrency}`,
                },
                {
                  id: 'toCurrency',
                  header: 'To',
                  cell: (row) => `${row.toAmount} ${row.toCurrency}`,
                },
                {
                  id: 'rate',
                  header: 'Rate',
                  accessorKey: 'rate',
                  cell: (row) => row.rate.toFixed(6),
                },
                {
                  id: 'status',
                  header: 'Status',
                  cell: (row) => {
                    const statusColors: Record<string, string> = {
                      success: 'bg-green-100 text-green-800',
                      completed: 'bg-green-100 text-green-800',
                      failed: 'bg-red-100 text-red-800',
                      pending: 'bg-yellow-100 text-yellow-800',
                    }
                    const colorClass = statusColors[row.status?.toLowerCase()] || 'bg-gray-100 text-gray-800'
                    return <Badge className={colorClass}>{row.status}</Badge>
                  },
                },
                {
                  id: 'createdAt',
                  header: 'Created',
                  cell: (row) => formatDateTime(row.createdAt),
                },
                {
                  id: 'actions',
                  header: 'Actions',
                  cell: (row) => (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/swaps/${row.id}`)
                      }}
                    >
                      <HiOutlineEye className="h-4 w-4" />
                    </button>
                  ),
                },
              ]}
              serverSidePagination={true}
              totalItems={swaps?.meta?.total || 0}
              currentPage={swapFilters.page || 1}
              onPageChange={(page) => setSwapFilters((prev) => ({ ...prev, page }))}
              pageSize={swapFilters.limit || 20}
              refreshable={true}
              onRefresh={() => refetchSwaps()}
              isRefreshing={swapsFetching}
              onRowClick={(row) => navigate(`/swaps/${row.id}`)}
              emptyStateTitle="No swaps found"
              emptyStateDescription="This user doesn't have any swaps yet."
            />
          )}
        </TabsContent>
        <TabsContent value="verification">
          {verificationLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader size="sm" />
            </div>
          ) : verification ? (
            <Card>
              <CardHeader>
                <CardTitle>Verification Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">
                    <Badge
                      className={
                        verification.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : verification.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                      }
                    >
                      {verification.status.charAt(0).toUpperCase() + verification.status.slice(1)}
                    </Badge>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Verification Level</label>
                  <p className="text-sm mt-1">Level {verification.level}</p>
                </div>

                {verification.documents && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Documents</label>
                    <div className="mt-2 space-y-2">
                      {verification.documents.front && (
                        <div>
                          <p className="text-xs text-muted-foreground">Front Document</p>
                          <a
                            href={verification.documents.front.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline"
                          >
                            View Document
                          </a>
                        </div>
                      )}
                      {verification.documents.back && (
                        <div>
                          <p className="text-xs text-muted-foreground">Back Document</p>
                          <a
                            href={verification.documents.back.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline"
                          >
                            View Document
                          </a>
                        </div>
                      )}
                      {verification.documents.selfie && (
                        <div>
                          <p className="text-xs text-muted-foreground">Selfie</p>
                          <a
                            href={verification.documents.selfie.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline"
                          >
                            View Document
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created</label>
                  <p className="text-sm mt-1">{formatDateTime(verification.createdAt)}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                  <p className="text-sm mt-1">{formatDateTime(verification.updatedAt)}</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Verification</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">No verification found for this user.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        <TabsContent value="activity">
          {activityLogsLoading && !(activityLogs as PaginatedResponse<ActivityLog> | undefined)?.data ? (
            <div className="flex items-center justify-center py-12">
              <Loader size="sm" />
            </div>
          ) : (
            <DataTable
              data={(activityLogs as PaginatedResponse<ActivityLog> | undefined)?.data || []}
              isLoading={activityLogsFetching}
              columns={[
                {
                  id: 'action',
                  header: 'Action',
                  accessorKey: 'action',
                },
                {
                  id: 'endpoint',
                  header: 'Endpoint',
                  accessorKey: 'endpoint',
                  cell: (row) => (
                    <span className="font-mono text-xs">{row.method} {row.endpoint}</span>
                  ),
                },
                {
                  id: 'status',
                  header: 'Status',
                  cell: (row) => {
                    const statusLower = (row.status || '').toLowerCase()
                    const isSuccess = statusLower === 'success'
                    return (
                      <Badge
                        className={
                          isSuccess
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }
                      >
                        {isSuccess ? 'Success' : (row.status || 'Error')}
                      </Badge>
                    )
                  },
                },
                {
                  id: 'ipAddress',
                  header: 'IP Address',
                  accessorKey: 'ipAddress',
                  cell: (row) => row.ipAddress || 'N/A',
                },
                {
                  id: 'executionTime',
                  header: 'Execution Time',
                  cell: (row) => (row.executionTime ? `${row.executionTime}ms` : 'N/A'),
                },
                {
                  id: 'createdAt',
                  header: 'Created',
                  cell: (row) => {
                    if (!row.createdAt) return 'N/A'
                    try {
                      const date = new Date(row.createdAt)
                      if (isNaN(date.getTime())) return 'N/A'
                      return formatDateTime(row.createdAt)
                    } catch {
                      return 'N/A'
                    }
                  },
                },
              ]}
              serverSidePagination={true}
              totalItems={activityLogs?.meta?.total || 0}
              currentPage={activityFilters.page || 1}
              onPageChange={(page) => setActivityFilters((prev) => ({ ...prev, page }))}
              pageSize={activityFilters.limit || 20}
              refreshable={true}
              onRefresh={() => refetchActivityLogs()}
              isRefreshing={activityLogsFetching}
              emptyStateTitle="No activity logs found"
              emptyStateDescription="This user doesn't have any activity logs yet."
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}


