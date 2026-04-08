import { apiClient } from '../../client'
import { PaginatedResponse } from '@/types/api/api'
import {
  User,
  UserFilter,
  UpdateUserDto,
  SuspendUserDto,
  ActivateUserDto,
  ResetPasswordDto,
  UpdateLoyaltyPointsDto,
} from '@/types/user/users'
import { Wallet } from '@/types/financial/wallets'
import { Transaction } from '@/types/financial/transactions'
import { Payment } from '@/types/financial/payments'
import { Swap } from '@/types/financial/swaps'
import { Verification } from '@/types/user/verifications'
import { ActivityLog } from '@/types/user/activity'

export const usersApi = {
  listUsers: async (filters?: UserFilter): Promise<PaginatedResponse<User>> => {
    return apiClient.get<PaginatedResponse<User>>('/admin/users', { params: filters })
  },

  getUserById: async (id: string): Promise<User> => {
    return apiClient.get<User>(`/admin/users/${id}`)
  },

  updateUser: async (id: string, data: UpdateUserDto): Promise<User> => {
    return apiClient.patch<User>(`/admin/users/${id}`, data)
  },

  suspendUser: async (id: string, data: SuspendUserDto): Promise<void> => {
    return apiClient.post(`/admin/users/${id}/suspend`, data)
  },

  activateUser: async (id: string, data?: ActivateUserDto): Promise<void> => {
    return apiClient.post(`/admin/users/${id}/activate`, data || {})
  },

  getUserActivityLogs: async (
    id: string,
    filters?: { page?: number; limit?: number; startDate?: string; endDate?: string }
  ): Promise<PaginatedResponse<ActivityLog>> => {
    return apiClient.get<PaginatedResponse<ActivityLog>>(`/admin/users/${id}/activity-logs`, {
      params: filters,
    })
  },

  getUserWallets: async (id: string): Promise<Wallet[]> => {
    return apiClient.get<Wallet[]>(`/admin/users/${id}/wallets`)
  },

  getUserTransactions: async (
    id: string,
    filters?: { page?: number; limit?: number }
  ): Promise<PaginatedResponse<Transaction>> => {
    return apiClient.get<PaginatedResponse<Transaction>>(`/admin/users/${id}/transactions`, {
      params: filters,
    })
  },

  getUserPayments: async (
    id: string,
    filters?: { page?: number; limit?: number }
  ): Promise<PaginatedResponse<Payment>> => {
    return apiClient.get<PaginatedResponse<Payment>>(`/admin/users/${id}/payments`, {
      params: filters,
    })
  },

  getUserSwaps: async (
    id: string,
    filters?: { page?: number; limit?: number }
  ): Promise<PaginatedResponse<Swap>> => {
    return apiClient.get<PaginatedResponse<Swap>>(`/admin/users/${id}/swaps`, {
      params: filters,
    })
  },

  getUserVerification: async (id: string): Promise<Verification> => {
    return apiClient.get<Verification>(`/admin/users/${id}/verification`)
  },

  resetUserPassword: async (id: string, data: ResetPasswordDto): Promise<void> => {
    return apiClient.post(`/admin/users/${id}/reset-password`, data)
  },

  resetUserPin: async (id: string): Promise<void> => {
    return apiClient.post(`/admin/users/${id}/reset-pin`)
  },

  getUserLoyaltyPoints: async (id: string): Promise<any> => {
    return apiClient.get(`/admin/users/${id}/loyalty-points`)
  },

  updateLoyaltyPoints: async (id: string, data: UpdateLoyaltyPointsDto): Promise<void> => {
    return apiClient.post(`/admin/users/${id}/loyalty-points`, data)
  },
}

