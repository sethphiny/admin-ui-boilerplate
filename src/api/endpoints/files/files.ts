import { apiClient } from '../../client'
import { PaginatedResponse } from '@/types/api/api'
import { File, FileFilter, VerificationDocuments } from '@/types/files'

export const filesApi = {
  listFiles: async (filters?: FileFilter): Promise<PaginatedResponse<File>> => {
    return apiClient.get<PaginatedResponse<File>>('/admin/files', { params: filters })
  },

  getFileById: async (id: string): Promise<File> => {
    return apiClient.get<File>(`/admin/files/${id}`)
  },

  downloadFile: async (id: string): Promise<Blob> => {
    const response = await apiClient.get(`/admin/files/${id}/download`, {
      responseType: 'blob',
    } as any)
    return response as any
  },

  deleteFile: async (id: string): Promise<void> => {
    return apiClient.delete(`/admin/files/${id}`)
  },

  getVerificationDocuments: async (id: string): Promise<VerificationDocuments> => {
    return apiClient.get<VerificationDocuments>(`/admin/files/verifications/${id}/documents`)
  },

  getVerificationDocument: async (
    id: string,
    documentType: 'front' | 'back' | 'selfie'
  ): Promise<File> => {
    return apiClient.get<File>(`/admin/files/verifications/${id}/documents/${documentType}`)
  },

  downloadVerificationDocument: async (
    id: string,
    documentType: 'front' | 'back' | 'selfie'
  ): Promise<Blob> => {
    const response = await apiClient.get(
      `/admin/files/verifications/${id}/documents/${documentType}/download`,
      {
        responseType: 'blob',
      } as any
    )
    return response as any
  },
}

