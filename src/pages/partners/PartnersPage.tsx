import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DataTable, Column } from '@/components/tables/DataTable'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { partnersApi } from '@/api/endpoints/partners/partners'
import { Partner } from '@/types/partners/partners'
import { handleApiError, showSuccessToast } from '@/lib/errorHandler'
import { TableSkeleton } from '@/components/ui/skeleton-loaders'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { HiOutlineKey, HiOutlineClipboard } from 'react-icons/hi2'
import { Switch } from '@/components/ui/switch'

export default function PartnersPage() {
  const queryClient = useQueryClient()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const { data: partners, isLoading, refetch } = useQuery({
    queryKey: ['partners'],
    queryFn: () => partnersApi.listPartners(),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      partnersApi.toggleActive(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners'] })
      showSuccessToast('Partner status updated')
    },
    onError: (error) => handleApiError(error),
  })

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    showSuccessToast(`${label} copied to clipboard`)
  }

  const columns: Column<Partner>[] = [
    {
      id: 'name',
      header: 'Partner Name',
      accessorKey: 'name',
    },
    {
      id: 'clientId',
      header: 'Client ID',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{row.clientId}</code>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => copyToClipboard(row.clientId, 'Client ID')}
          >
            <HiOutlineClipboard className="h-3 w-3" />
          </Button>
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Switch
            checked={row.isActive}
            onCheckedChange={(checked) =>
              toggleMutation.mutate({ id: row.id, isActive: checked })
            }
            disabled={toggleMutation.isPending}
          />
          <Badge variant={row.isActive ? 'default' : 'secondary'} className={row.isActive ? 'bg-green-100 text-green-800 hover:bg-green-100 border-green-200' : ''}>
            {row.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      ),
    },
    {
      id: 'createdOn',
      header: 'Registered',
      cell: (row) => new Date(row.createdOn).toLocaleDateString(),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (_row) => (
        <TooltipProvider>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => {/* TODO: Show secrets modal */}}
                >
                  <HiOutlineKey className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View Secrets</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      ),
    },
  ]

  const onRefresh = async () => {
    setIsRefreshing(true)
    await refetch()
    setIsRefreshing(false)
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Partner Management"
        description="Monitor and manage all integrated business partners"
        actions={
          <div className="flex gap-2">
            <Button onClick={() => {/* TODO: Open Create Modal */}}>
              Add Partner
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <TableSkeleton />
      ) : (
        <DataTable
          data={partners || []}
          columns={columns}
          isLoading={isLoading}
          refreshable={true}
          onRefresh={onRefresh}
          isRefreshing={isRefreshing}
          emptyStateTitle="No partners found"
          emptyStateDescription="Get started by creating your first partner."
        />
      )}
    </div>
  )
}
