export interface TransactionRequiringReview {
  id: string
  reference: string
  amount: number
  currency: string
  isCryptoTransfer?: boolean
  isPayout?: boolean
  autoReviewThreshold?: number
  cryptoDetails?: {
    address: string
    networkId: string
  }
  payoutDetails?: {
    bankName: string
    accountNumber: string
    accountName: string
  }
}
