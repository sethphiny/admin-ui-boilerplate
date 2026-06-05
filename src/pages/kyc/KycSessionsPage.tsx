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
import { HiOutlineCheck, HiOutlineXMark, HiOutlineEye, HiOutlineTrash } from 'react-icons/hi2'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
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

export default function KycSessionsPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const limit = 10

  // Details Modal State
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  
  // Selected sessions for batch actions
  const [selectedSessions, setSelectedSessions] = useState<KycSession[]>([])
  
  // Delete Confirmation State
  const [sessionsToDelete, setSessionsToDelete] = useState<{ id: string; sessionId: string }[] | null>(null)

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['kyc-sessions', page],
    queryFn: () => kycApi.listSessions(page, limit),
  })

  // Query to fetch single session details (includes kycData)
  const { data: sessionDetails, isLoading: loadingDetails } = useQuery({
    queryKey: ['kyc-session-details', selectedSessionId],
    queryFn: () => kycApi.getSession(selectedSessionId!),
    enabled: !!selectedSessionId,
  })

  const approveMutation = useMutation({
    mutationFn: (sessionId: string) => kycApi.approveSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kyc-sessions'] })
      queryClient.invalidateQueries({ queryKey: ['kyc-session-details'] })
      showSuccessToast('KYC session approved')
      setSelectedSessionId(null) // Close modal if open
    },
    onError: (error) => handleApiError(error),
  })

  const rejectMutation = useMutation({
    mutationFn: ({ sessionId, reason }: { sessionId: string; reason: string }) =>
      kycApi.rejectSession(sessionId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kyc-sessions'] })
      queryClient.invalidateQueries({ queryKey: ['kyc-session-details'] })
      showSuccessToast('KYC session rejected')
      setSelectedSessionId(null) // Close modal if open
    },
    onError: (error) => handleApiError(error),
  })

  const deleteMutation = useMutation({
    mutationFn: (ids: string[]) => {
      if (ids.length === 1) {
        return kycApi.deleteSession(ids[0])
      }
      return kycApi.batchDeleteSessions(ids)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['kyc-sessions'] })
      const count = variables.length
      showSuccessToast(
        count === 1 
          ? 'KYC session deleted successfully' 
          : `${count} KYC sessions deleted successfully`
      )
      setSelectedSessionId(null)
      setSessionsToDelete(null)
      setSelectedSessions([]) // Clear checkbox selections
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
                  onClick={() => setSelectedSessionId(row.id)}
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
                      onClick={() => approveMutation.mutate(row.sessionId)}
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
                        if (reason) rejectMutation.mutate({ sessionId: row.sessionId, reason })
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

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => {
                    setSessionsToDelete([{ id: row.id, sessionId: row.sessionId }])
                  }}
                  disabled={deleteMutation.isPending}
                >
                  <HiOutlineTrash className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Delete Session</p>
              </TooltipContent>
            </Tooltip>
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
        actions={
          selectedSessions.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                setSessionsToDelete(
                  selectedSessions.map((s) => ({ id: s.id, sessionId: s.sessionId }))
                )
              }}
              className="animate-in fade-in slide-in-from-right-2 duration-200"
            >
              <HiOutlineTrash className="h-4 w-4 mr-2" />
              Delete Selected ({selectedSessions.length})
            </Button>
          )
        }
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
          selectable={true}
          selectedRows={selectedSessions}
          onSelectionChange={setSelectedSessions}
        />
      )}

      {/* KYC Details Dialog */}
      <Dialog
        open={!!selectedSessionId}
        onOpenChange={(open) => {
          if (!open) setSelectedSessionId(null)
        }}
      >
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>KYC Session Review</DialogTitle>
          </DialogHeader>

          {loadingDetails ? (
            <div className="space-y-4 py-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : sessionDetails ? (
            <div className="space-y-6 py-2">
              {/* Header Overview Card */}
              <div className="grid grid-cols-2 gap-4 bg-muted/40 p-4 rounded-lg border border-border/40 text-sm">
                <div>
                  <span className="text-muted-foreground block font-medium">Business Name</span>
                  <span className="font-semibold text-base">{sessionDetails.businessName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block font-medium">Session ID</span>
                  <span className="font-mono text-xs">{sessionDetails.sessionId}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block font-medium">Country</span>
                  <span>{sessionDetails.country}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block font-medium">Status</span>
                  <span className="inline-block mt-0.5">{getStatusBadge(sessionDetails.status)}</span>
                </div>
              </div>

              {/* KycData Submission Information */}
              {sessionDetails.kycData ? (
                <div className="space-y-6">
                  {/* BVN Info */}
                  <div className="border border-border/40 rounded-lg p-4">
                    <h4 className="text-sm font-semibold mb-3">Identity Verification</h4>
                    <div className="flex items-center gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground block">BVN</span>
                        <code className="font-mono text-base font-semibold">{sessionDetails.kycData.bvn || 'N/A'}</code>
                      </div>
                      <div className="ml-auto">
                        {sessionDetails.kycData.isBvnVerified ? (
                          <Badge className="bg-green-100 text-green-800 border-green-200">BVN Verified</Badge>
                        ) : (
                          <Badge variant="outline">BVN Unverified</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Company Data */}
                  <div className="border border-border/40 rounded-lg p-4">
                    <h4 className="text-sm font-semibold mb-3">Company Metadata</h4>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                      {Object.entries(sessionDetails.kycData.companyData || {}).map(([key, val]) => (
                        <div key={key}>
                          <span className="text-muted-foreground block capitalize">{key.replace(/_/g, ' ')}</span>
                          <span className="font-medium">{String(val)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Directors Data */}
                  <div className="border border-border/40 rounded-lg p-4">
                    <h4 className="text-sm font-semibold mb-3">Directors & Stakeholders</h4>
                    <div className="divide-y divide-border/30">
                      {Array.isArray(sessionDetails.kycData.directorsData) ? (
                        sessionDetails.kycData.directorsData.map((director: any, idx: number) => (
                          <div key={idx} className="py-2.5 first:pt-0 last:pb-0 text-sm">
                            <div className="font-medium">{director.name || `Director ${idx + 1}`}</div>
                            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mt-1">
                              <div>Role: {director.role || 'N/A'}</div>
                              {director.email && <div>Email: {director.email}</div>}
                              {director.phone && <div>Phone: {director.phone}</div>}
                            </div>
                          </div>
                        ))
                      ) : (
                        <pre className="text-xs font-mono bg-muted p-2 rounded overflow-x-auto whitespace-pre-wrap break-all">
                          {JSON.stringify(sessionDetails.kycData.directorsData, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>

                  {/* ID Cards Upload Preview */}
                  {sessionDetails.kycData.idCards && (
                    <div className="border border-border/40 rounded-lg p-4">
                      <h4 className="text-sm font-semibold mb-3">Identification Documents</h4>
                      <div className="grid grid-cols-2 gap-4">
                        {Object.entries(sessionDetails.kycData.idCards).map(([key, val]) => (
                          <div key={key} className="border border-border/30 rounded p-3 bg-muted/20">
                            <span className="text-xs text-muted-foreground block capitalize mb-1">{key} Card</span>
                            {typeof val === 'string' && (val.endsWith('.jpg') || val.endsWith('.png') || val.endsWith('.jpeg')) ? (
                              <div className="mt-2 aspect-video bg-muted rounded flex items-center justify-center border border-dashed border-border/60">
                                <span className="text-xs text-muted-foreground">Document File Preview</span>
                              </div>
                            ) : (
                              <code className="text-xs font-mono break-all">{String(val)}</code>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 border border-dashed border-border/40 rounded-lg">
                  <p className="text-sm text-muted-foreground">No document data has been submitted for this session yet.</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-4 border-t border-border/40">
                <Button
                  type="button"
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                  onClick={() => {
                    setSessionsToDelete([{ id: sessionDetails.id, sessionId: sessionDetails.sessionId }])
                  }}
                  disabled={deleteMutation.isPending}
                >
                  Delete Session
                </Button>
                {sessionDetails.status === KycStatus.PENDING && (
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => {
                        const reason = window.prompt('Enter rejection reason:')
                        if (reason) rejectMutation.mutate({ sessionId: sessionDetails.sessionId, reason })
                      }}
                      disabled={rejectMutation.isPending}
                    >
                      Reject KYC
                    </Button>
                    <Button
                      type="button"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => approveMutation.mutate(sessionDetails.sessionId)}
                      disabled={approveMutation.isPending}
                    >
                      Approve KYC
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground py-4">Failed to load session details.</p>
          )}
        </DialogContent>
      </Dialog>
      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog
        open={!!sessionsToDelete}
        onOpenChange={(open) => {
          if (!open) setSessionsToDelete(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete{' '}
              {sessionsToDelete && sessionsToDelete.length === 1 ? (
                <>
                  the KYC session
                  <code className="bg-muted px-1.5 py-0.5 rounded text-xs mx-1 font-mono text-foreground">
                    {sessionsToDelete[0].sessionId}
                  </code>
                </>
              ) : (
                <>
                  the <strong>{sessionsToDelete?.length}</strong> selected KYC sessions
                </>
              )}{' '}
              and all associated documents and webhook logs.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSessionsToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (sessionsToDelete) {
                  deleteMutation.mutate(sessionsToDelete.map((s) => s.id))
                }
              }}
            >
              Delete {sessionsToDelete && sessionsToDelete.length > 1 ? 'Sessions' : 'Session'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
