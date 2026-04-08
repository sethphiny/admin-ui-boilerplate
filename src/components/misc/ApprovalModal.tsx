import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { transactionsApi } from '@/api/endpoints/transactions/transactions'
import { TransactionRequiringReview } from '@/types/financial/transactions'
import { showSuccessToast, showErrorToast } from '@/lib/errorHandler'

interface ApprovalModalProps {
  transaction: TransactionRequiringReview
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ApprovalModal({ transaction, open, onOpenChange }: ApprovalModalProps) {
  const [reason, setReason] = useState('')
  const queryClient = useQueryClient()

  const approveMutation = useMutation({
    mutationFn: (data?: { reason?: string }) =>
      transactionsApi.approveTransactionReview(transaction.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions-requiring-review'] })
      queryClient.invalidateQueries({ queryKey: ['transaction', transaction.id] })
      showSuccessToast('Transaction approved successfully')
      setReason('')
      onOpenChange(false)
    },
    onError: (error) => {
      showErrorToast(error)
    },
  })

  const handleApprove = () => {
    approveMutation.mutate(reason ? { reason } : undefined)
  }

  const formatAmount = (amount: number, currency: string) => {
    return `${amount} ${currency}`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Approve Transaction for Processing</DialogTitle>
          <DialogDescription>
            This will allow the transaction to be processed automatically. Please review the details
            below before approving.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Transaction Summary */}
          <div className="rounded-lg border p-4 space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Reference:</span>
                <p className="font-mono font-medium">{transaction.reference}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Type:</span>
                <p className="font-medium">
                  {transaction.isCryptoTransfer ? 'Crypto Transfer' : 'Fiat Payout'}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Amount:</span>
                <p className="font-semibold">
                  {formatAmount(transaction.amount, transaction.currency)}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Threshold:</span>
                <p className="font-medium">
                  {transaction.autoReviewThreshold
                    ? formatAmount(transaction.autoReviewThreshold, transaction.currency)
                    : 'N/A'}
                </p>
              </div>
              {transaction.isCryptoTransfer && transaction.cryptoDetails && (
                <>
                  <div>
                    <span className="text-muted-foreground">Address:</span>
                    <p className="font-mono text-xs break-all">{transaction.cryptoDetails.address}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Network:</span>
                    <p className="font-medium">{transaction.cryptoDetails.networkId}</p>
                  </div>
                </>
              )}
              {transaction.isPayout && transaction.payoutDetails && (
                <>
                  <div>
                    <span className="text-muted-foreground">Bank:</span>
                    <p className="font-medium">{transaction.payoutDetails.bankName}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Account:</span>
                    <p className="font-medium">
                      {transaction.payoutDetails.accountNumber} - {transaction.payoutDetails.accountName}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Approval Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Approval Reason (Optional)</Label>
            <Textarea
              id="reason"
              placeholder="Enter a reason for approving this transaction..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              This reason will be recorded in the transaction metadata for audit purposes.
            </p>
          </div>

          {/* Warning */}
          <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3">
            <p className="text-sm text-yellow-800">
              <strong>Warning:</strong> Approving this transaction will allow it to be processed
              automatically. Make sure you have verified all details before proceeding.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={approveMutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleApprove} disabled={approveMutation.isPending}>
            {approveMutation.isPending ? 'Approving...' : 'Approve Transaction'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

