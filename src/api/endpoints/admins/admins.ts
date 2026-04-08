import { apiClient } from '../../client'
import { PaginatedResponse } from '@/types/api/api'
import {
  Admin,
  AdminFilter,
  CreateAdminDto,
  UpdateAdminDto,
  SuspendAdminDto,
  ChangeAdminPasswordDto,
} from '@/types/admin/admins'

export const adminsApi = {
  listAdmins: async (filters?: AdminFilter): Promise<PaginatedResponse<Admin>> => {
    return apiClient.get<PaginatedResponse<Admin>>('/admin/admins', { params: filters })
  },

  getAdminById: async (id: string): Promise<Admin> => {
    return apiClient.get<Admin>(`/admin/admins/${id}`)
  },

  createAdmin: async (data: CreateAdminDto): Promise<Admin> => {
    return apiClient.post<Admin>('/admin/admins', data)
  },

  updateAdmin: async (id: string, data: UpdateAdminDto): Promise<Admin> => {
    return apiClient.patch<Admin>(`/admin/admins/${id}`, data)
  },

  suspendAdmin: async (id: string, data: SuspendAdminDto): Promise<void> => {
    return apiClient.post(`/admin/admins/${id}/suspend`, data)
  },

  activateAdmin: async (id: string): Promise<void> => {
    return apiClient.post(`/admin/admins/${id}/activate`)
  },

  changeAdminPassword: async (id: string, data: ChangeAdminPasswordDto): Promise<void> => {
    return apiClient.post(`/admin/admins/${id}/change-password`, data)
  },
}

