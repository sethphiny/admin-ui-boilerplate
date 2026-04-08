import { apiClient } from '../../client'
import { PaginatedResponse } from '@/types/api/api'
import {
  Approval,
  ApprovalFilter,
  ApproveApprovalDto,
  RejectApprovalDto,
} from '@/types/admin/approvals'

export const approvalsApi = {
  listApprovals: async (filters?: ApprovalFilter): Promise<PaginatedResponse<Approval>> => {
    return apiClient.get<PaginatedResponse<Approval>>('/admin/approvals', { params: filters })
  },

  listPendingApprovals: async (filters?: {
    page?: number
    limit?: number
  }): Promise<PaginatedResponse<Approval>> => {
    return apiClient.get<PaginatedResponse<Approval>>('/admin/approvals/pending', {
      params: filters,
    })
  },

  listMyRequests: async (filters?: {
    page?: number
    limit?: number
  }): Promise<PaginatedResponse<Approval>> => {
    return apiClient.get<PaginatedResponse<Approval>>('/admin/approvals/my-requests', {
      params: filters,
    })
  },

  getApprovalById: async (id: string): Promise<Approval> => {
    return apiClient.get<Approval>(`/admin/approvals/${id}`)
  },

  approveApproval: async (id: string, data?: ApproveApprovalDto): Promise<void> => {
    return apiClient.post(`/admin/approvals/${id}/approve`, data || {})
  },

  rejectApproval: async (id: string, data: RejectApprovalDto): Promise<void> => {
    return apiClient.post(`/admin/approvals/${id}/reject`, data)
  },

  expireApproval: async (id: string): Promise<void> => {
    return apiClient.post(`/admin/approvals/${id}/expire`)
  },
}

