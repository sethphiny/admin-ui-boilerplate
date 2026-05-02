import { apiClient } from '../../client'
import { Partner, CreatePartnerDto, UpdatePartnerDto } from '@/types/partners/partners'

export const partnersApi = {
  listPartners: async (): Promise<Partner[]> => {
    return apiClient.get<Partner[]>('/admin/partners')
  },

  getPartner: async (id: string): Promise<Partner> => {
    return apiClient.get<Partner>(`/admin/partners/${id}`)
  },

  createPartner: async (data: CreatePartnerDto): Promise<Partner> => {
    return apiClient.post<Partner>('/admin/partners', data)
  },

  updatePartner: async (id: string, data: UpdatePartnerDto): Promise<Partner> => {
    return apiClient.patch<Partner>(`/admin/partners/${id}`, data)
  },

  toggleActive: async (id: string, isActive: boolean): Promise<Partner> => {
    return apiClient.patch<Partner>(`/admin/partners/${id}`, { isActive })
  },
}
