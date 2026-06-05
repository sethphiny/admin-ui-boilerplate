import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DataTable, Column } from '@/components/tables/DataTable'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { partnersApi } from '@/api/endpoints/partners/partners'
import { Partner, CreatePartnerDto } from '@/types/partners/partners'
import { handleApiError, showSuccessToast } from '@/lib/errorHandler'
import { TableSkeleton } from '@/components/ui/skeleton-loaders'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { HiOutlineKey, HiOutlineClipboard, HiOutlineEye, HiOutlineEyeSlash } from 'react-icons/hi2'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function PartnersPage() {
  const queryClient = useQueryClient()
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Dialog States
  const [showAddPartner, setShowAddPartner] = useState(false)
  const [selectedPartnerForSecrets, setSelectedPartnerForSecrets] = useState<Partner | null>(null)
  
  // Visibility States for Secrets Modal
  const [showClientSecret, setShowClientSecret] = useState(false)
  const [showWebhookSecret, setShowWebhookSecret] = useState(false)

  // Add Partner Form States
  const [newPartnerName, setNewPartnerName] = useState('')
  const [newPartnerClientId, setNewPartnerClientId] = useState('')
  const [newPartnerClientSecret, setNewPartnerClientSecret] = useState('')
  const [newPartnerWebhookSecret, setNewPartnerWebhookSecret] = useState('')

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

  const createPartnerMutation = useMutation({
    mutationFn: (data: CreatePartnerDto) => partnersApi.createPartner(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners'] })
      showSuccessToast('Partner created successfully')
      setShowAddPartner(false)
      // Reset form
      setNewPartnerName('')
      setNewPartnerClientId('')
      setNewPartnerClientSecret('')
      setNewPartnerWebhookSecret('')
    },
    onError: (error) => handleApiError(error),
  })

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    showSuccessToast(`${label} copied to clipboard`)
  }

  const generateCredentials = () => {
    const randomHex = (len: number) => {
      const chars = '0123456789abcdef';
      let result = '';
      for (let i = 0; i < len; i++) {
        result += chars[Math.floor(Math.random() * chars.length)];
      }
      return result;
    };
    
    const randomString = (len: number) => {
      const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';
      for (let i = 0; i < len; i++) {
        result += chars[Math.floor(Math.random() * chars.length)];
      }
      return result;
    };

    setNewPartnerClientId(`partner_${randomHex(8)}`);
    setNewPartnerClientSecret(`secret_${randomString(24)}`);
    setNewPartnerWebhookSecret(`whsec_${randomHex(16)}`);
  };

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
      cell: (row) => (
        <TooltipProvider>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => {
                    setShowClientSecret(false)
                    setShowWebhookSecret(false)
                    setSelectedPartnerForSecrets(row)
                  }}
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
            <Button onClick={() => setShowAddPartner(true)}>
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

      {/* Add Partner Dialog */}
      <Dialog open={showAddPartner} onOpenChange={setShowAddPartner}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Register New Partner</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (!newPartnerName || !newPartnerClientId || !newPartnerClientSecret) return
              createPartnerMutation.mutate({
                name: newPartnerName,
                clientId: newPartnerClientId,
                clientSecret: newPartnerClientSecret,
                webhookSecret: newPartnerWebhookSecret || undefined,
              })
            }}
            className="space-y-4 py-2"
          >
            <div className="space-y-1.5">
              <Label htmlFor="partner-name">Partner Name</Label>
              <Input
                id="partner-name"
                placeholder="e.g. ABC Logistics"
                value={newPartnerName}
                onChange={(e) => setNewPartnerName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="partner-client-id">Client ID</Label>
                <Button
                  type="button"
                  variant="link"
                  className="h-auto p-0 text-xs text-primary hover:no-underline"
                  onClick={generateCredentials}
                >
                  Generate Credentials
                </Button>
              </div>
              <Input
                id="partner-client-id"
                placeholder="partner_abc_123"
                value={newPartnerClientId}
                onChange={(e) => setNewPartnerClientId(e.target.value)}
                className="font-mono text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="partner-client-secret">Client Secret</Label>
              <Input
                id="partner-client-secret"
                placeholder="secret_key_789"
                value={newPartnerClientSecret}
                onChange={(e) => setNewPartnerClientSecret(e.target.value)}
                className="font-mono text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="partner-webhook-secret">Webhook Secret (Optional)</Label>
              <Input
                id="partner-webhook-secret"
                placeholder="whsec_555..."
                value={newPartnerWebhookSecret}
                onChange={(e) => setNewPartnerWebhookSecret(e.target.value)}
                className="font-mono text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddPartner(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  createPartnerMutation.isPending ||
                  !newPartnerName ||
                  !newPartnerClientId ||
                  !newPartnerClientSecret
                }
              >
                {createPartnerMutation.isPending ? 'Registering...' : 'Register Partner'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Secrets Dialog */}
      <Dialog
        open={!!selectedPartnerForSecrets}
        onOpenChange={(open) => {
          if (!open) setSelectedPartnerForSecrets(null)
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Partner Credentials</DialogTitle>
          </DialogHeader>
          {selectedPartnerForSecrets && (
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground">
                Credentials for <strong>{selectedPartnerForSecrets.name}</strong>. Keep these keys secure.
              </p>
              
              <div className="space-y-3">
                {/* Client ID */}
                <div className="space-y-1.5">
                  <Label htmlFor="view-client-id">Client ID</Label>
                  <div className="flex gap-2">
                    <Input
                      id="view-client-id"
                      value={selectedPartnerForSecrets.clientId}
                      readOnly
                      className="font-mono text-xs bg-muted"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(selectedPartnerForSecrets.clientId, 'Client ID')}
                    >
                      <HiOutlineClipboard className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Client Secret */}
                <div className="space-y-1.5">
                  <Label htmlFor="view-client-secret">Client Secret</Label>
                  <div className="flex gap-2">
                    <Input
                      id="view-client-secret"
                      type={showClientSecret ? 'text' : 'password'}
                      value={selectedPartnerForSecrets.clientSecret || ''}
                      readOnly
                      className="font-mono text-xs bg-muted"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setShowClientSecret(!showClientSecret)}
                    >
                      {showClientSecret ? (
                        <HiOutlineEyeSlash className="h-4 w-4" />
                      ) : (
                        <HiOutlineEye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(selectedPartnerForSecrets.clientSecret || '', 'Client Secret')}
                    >
                      <HiOutlineClipboard className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Webhook Secret */}
                <div className="space-y-1.5">
                  <Label htmlFor="view-webhook-secret">Webhook Secret</Label>
                  <div className="flex gap-2">
                    <Input
                      id="view-webhook-secret"
                      type={showWebhookSecret ? 'text' : 'password'}
                      value={selectedPartnerForSecrets.webhookSecret || 'N/A'}
                      readOnly
                      className="font-mono text-xs bg-muted"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                      disabled={!selectedPartnerForSecrets.webhookSecret}
                    >
                      {showWebhookSecret ? (
                        <HiOutlineEyeSlash className="h-4 w-4" />
                      ) : (
                        <HiOutlineEye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(selectedPartnerForSecrets.webhookSecret || '', 'Webhook Secret')}
                      disabled={!selectedPartnerForSecrets.webhookSecret}
                    >
                      <HiOutlineClipboard className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
