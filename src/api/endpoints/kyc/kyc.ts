import { apiClient } from '../../client'
import { KycSessionsResponse, KycSession } from '@/types/kyc/kyc'

export const kycApi = {
  listSessions: async (page = 1, limit = 10): Promise<KycSessionsResponse> => {
    return apiClient.get<KycSessionsResponse>('/admin/kyc/sessions', {
      params: { page, limit },
    })
  },

  getSession: async (id: string): Promise<KycSession> => {
    return apiClient.get<KycSession>(`/admin/kyc/sessions/${id}`)
  },

  approveSession: async (id: string): Promise<void> => {
    return apiClient.post(`/admin/kyc/approve/${id}`)
  },

  rejectSession: async (id: string, reason: string): Promise<void> => {
    return apiClient.post(`/admin/kyc/reject/${id}`, { reason })
  },

  deleteSession: async (id: string): Promise<void> => {
    return apiClient.delete(`/admin/kyc/sessions/${id}`)
  },

  batchDeleteSessions: async (ids: string[]): Promise<void> => {
    return apiClient.post('/admin/kyc/sessions/batch-delete', { ids })
  },
}
