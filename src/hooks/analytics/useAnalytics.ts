import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '@/api/endpoints/analytics/analytics'
import {
  BaseAnalyticsFilter,
  TransactionVolumeFilter,
  TransactionsByTypeFilter,
  RevenueTrendsFilter,
  PaymentVolumeFilter,
  PaymentsByCategoryFilter,
  BillPaymentsFilter,
  FlightBookingsFilter,
  TransactionSummaryFilter,
  ComprehensiveAnalyticsFilter,
} from '@/types/analytics/analytics'

/**
 * Hook for fetching user growth analytics
 */
export function useUserGrowth(filters?: BaseAnalyticsFilter) {
  return useQuery({
    queryKey: ['analytics', 'user-growth', filters],
    queryFn: () => analyticsApi.getUserGrowth(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Hook for fetching transaction volume analytics
 */
export function useTransactionVolume(filters?: TransactionVolumeFilter) {
  return useQuery({
    queryKey: ['analytics', 'transaction-volume', filters],
    queryFn: () => analyticsApi.getTransactionVolume(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Hook for fetching transactions by type analytics
 */
export function useTransactionsByType(filters?: TransactionsByTypeFilter) {
  return useQuery({
    queryKey: ['analytics', 'transactions-by-type', filters],
    queryFn: () => analyticsApi.getTransactionsByType(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Hook for fetching revenue trends analytics
 */
export function useRevenueTrends(filters?: RevenueTrendsFilter) {
  return useQuery({
    queryKey: ['analytics', 'revenue-trends', filters],
    queryFn: () => analyticsApi.getRevenueTrends(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Hook for fetching payment volume analytics
 */
export function usePaymentVolume(filters?: PaymentVolumeFilter) {
  return useQuery({
    queryKey: ['analytics', 'payment-volume', filters],
    queryFn: () => analyticsApi.getPaymentVolume(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Hook for fetching payments by category analytics
 */
export function usePaymentsByCategory(filters?: PaymentsByCategoryFilter) {
  return useQuery({
    queryKey: ['analytics', 'payments-by-category', filters],
    queryFn: () => analyticsApi.getPaymentsByCategory(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Hook for fetching bill payments analytics
 */
export function useBillPayments(filters?: BillPaymentsFilter) {
  return useQuery({
    queryKey: ['analytics', 'bill-payments', filters],
    queryFn: () => analyticsApi.getBillPayments(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Hook for fetching flight bookings analytics
 */
export function useFlightBookings(filters?: FlightBookingsFilter) {
  return useQuery({
    queryKey: ['analytics', 'flight-bookings', filters],
    queryFn: () => analyticsApi.getFlightBookings(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Hook for fetching transaction summary
 */
export function useTransactionSummary(filters?: TransactionSummaryFilter) {
  return useQuery({
    queryKey: ['analytics', 'transaction-summary', filters],
    queryFn: () => analyticsApi.getTransactionSummary(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Hook for fetching transactions by type summary
 */
export function useTransactionsByTypeSummary(filters?: TransactionSummaryFilter) {
  return useQuery({
    queryKey: ['analytics', 'transactions-by-type-summary', filters],
    queryFn: () => analyticsApi.getTransactionsByTypeSummary(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Hook for fetching bill payment transactions summary
 */
export function useBillPaymentTransactions(filters?: TransactionSummaryFilter) {
  return useQuery({
    queryKey: ['analytics', 'bill-payment-transactions', filters],
    queryFn: () => analyticsApi.getBillPaymentTransactions(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Hook for fetching payment summary
 */
export function usePaymentSummary(filters?: PaymentVolumeFilter) {
  return useQuery({
    queryKey: ['analytics', 'payment-summary', filters],
    queryFn: () => analyticsApi.getPaymentSummary(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Hook for fetching payments by category summary
 */
export function usePaymentsByCategorySummary(filters?: PaymentVolumeFilter) {
  return useQuery({
    queryKey: ['analytics', 'payments-by-category-summary', filters],
    queryFn: () => analyticsApi.getPaymentsByCategorySummary(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Hook for fetching bill payment summary
 */
export function useBillPaymentSummary(filters?: BillPaymentsFilter) {
  return useQuery({
    queryKey: ['analytics', 'bill-payment-summary', filters],
    queryFn: () => analyticsApi.getBillPaymentSummary(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Hook for fetching comprehensive analytics (all data in one response)
 */
export function useComprehensiveAnalytics(filters?: ComprehensiveAnalyticsFilter) {
  return useQuery({
    queryKey: ['analytics', 'comprehensive', filters],
    queryFn: () => analyticsApi.getComprehensiveAnalytics(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}
