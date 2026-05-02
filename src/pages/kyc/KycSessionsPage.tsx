import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DataTable, Column } from '@/components/tables/DataTable'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { kycApi } from '@/api/endpoints/kyc/kyc'
import { KycSession, KycStatus } from '@/types/kyc/kyc'
import { handleApiError, showSuccessToast } from '@/lib/errorHandler'
import { TableSkeleton } from '@/components/ui/skeleton-loaders'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { HiOutlineCheck, HiOutlineXMark, HiOutlineEye } from 'react-icons/hi2'

export default function KycSessionsPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const limit = 10

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['kyc-sessions', page],
    queryFn: () => kycApi.listSessions(page, limit),
  })

  const approveMutation = useMutation({
    mutationFn: (id: string) => kycApi.approveSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kyc-sessions'] })
      showSuccessToast('KYC session approved')
    },
    onError: (error) => handleApiError(error),
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      kycApi.rejectSession(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kyc-sessions'] })
      showSuccessToast('KYC session rejected')
    },
    onError: (error) => handleApiError(error),
  })

  const getStatusBadge = (status: KycStatus) => {
    switch (status) {
      case KycStatus.VERIFIED:
        return <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">Verified</Badge>
      case KycStatus.REJECTED:
        return <Badge variant="destructive">Rejected</Badge>
      case KycStatus.PENDING:
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Pending</Badge>
      case KycStatus.INITIATED:
        return <Badge variant="secondary">Initiated</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const columns: Column<KycSession>[] = [
    {
      id: 'sessionId',
      header: 'Session ID',
      accessorKey: 'sessionId',
    },
    {
      id: 'businessName',
      header: 'Business',
      accessorKey: 'businessName',
    },
    {
      id: 'country',
      header: 'Country',
      accessorKey: 'country',
    },
    {
      id: 'status',
      header: 'Status',
      cell: (row) => getStatusBadge(row.status),
    },
    {
      id: 'createdOn',
      header: 'Date',
      cell: (row) => new Date(row.createdOn).toLocaleDateString(),
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
                  className="h-8 w-8 p-0"
                  onClick={() => {/* TODO: View Details */}}
                >
                  <HiOutlineEye className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View Details</p>
              </TooltipContent>
            </Tooltip>
            
            {row.status === KycStatus.PENDING && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                      onClick={() => approveMutation.mutate(row.id)}
                      disabled={approveMutation.isPending}
                    >
                      <HiOutlineCheck className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Approve</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => {
                        const reason = window.prompt('Enter rejection reason:')
                        if (reason) rejectMutation.mutate({ id: row.id, reason })
                      }}
                      disabled={rejectMutation.isPending}
                    >
                      <HiOutlineXMark className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Reject</p>
                  </TooltipContent>
                </Tooltip>
              </>
            )}
          </div>
        </TooltipProvider>
      ),
    },
  ]

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="KYC Sessions"
        description="Review and manage KYC verification requests"
      />

      {isLoading && !data ? (
        <TableSkeleton />
      ) : (
        <DataTable
          data={data?.data || []}
          columns={columns}
          serverSidePagination={true}
          totalItems={data?.meta?.total || 0}
          currentPage={page}
          onPageChange={setPage}
          pageSize={limit}
          isLoading={isFetching}
          refreshable={true}
          onRefresh={() => refetch()}
          isRefreshing={isFetching}
          emptyStateTitle="No KYC sessions found"
          emptyStateDescription="All caught up! No KYC requests found."
        />
      )}
    </div>
  )
}
