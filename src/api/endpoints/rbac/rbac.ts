import { apiClient } from '../../client'
import { PaginatedResponse } from '@/types/api/api'
import {
  Role,
  Permission,
  CreateRoleDto,
  UpdateRoleDto,
  CreatePermissionDto,
  UpdatePermissionDto,
  AssignPermissionsDto,
  ResourcesAndActions,
} from '@/types/admin/rbac'

export const rbacApi = {
  // Roles
  listRoles: async (filters?: { page?: number; limit?: number }): Promise<PaginatedResponse<Role>> => {
    return apiClient.get<PaginatedResponse<Role>>('/admin/rbac/roles', { params: filters })
  },

  getRoleById: async (id: string): Promise<Role> => {
    return apiClient.get<Role>(`/admin/rbac/roles/${id}`)
  },

  createRole: async (data: CreateRoleDto): Promise<Role> => {
    return apiClient.post<Role>('/admin/rbac/roles', data)
  },

  updateRole: async (id: string, data: UpdateRoleDto): Promise<Role> => {
    return apiClient.patch<Role>(`/admin/rbac/roles/${id}`, data)
  },

  deleteRole: async (id: string): Promise<void> => {
    return apiClient.delete(`/admin/rbac/roles/${id}`)
  },

  // Permissions
  listPermissions: async (filters?: {
    page?: number
    limit?: number
  }): Promise<PaginatedResponse<Permission>> => {
    return apiClient.get<PaginatedResponse<Permission>>('/admin/rbac/permissions', {
      params: filters,
    })
  },

  getResourcesAndActions: async (): Promise<ResourcesAndActions> => {
    return apiClient.get<ResourcesAndActions>('/admin/rbac/permissions/resources-actions')
  },

  getPermissionById: async (id: string): Promise<Permission> => {
    return apiClient.get<Permission>(`/admin/rbac/permissions/${id}`)
  },

  createPermission: async (data: CreatePermissionDto): Promise<Permission> => {
    return apiClient.post<Permission>('/admin/rbac/permissions', data)
  },

  updatePermission: async (id: string, data: UpdatePermissionDto): Promise<Permission> => {
    return apiClient.patch<Permission>(`/admin/rbac/permissions/${id}`, data)
  },

  // Role Permissions
  getRolePermissions: async (id: string): Promise<Permission[]> => {
    return apiClient.get<Permission[]>(`/admin/rbac/roles/${id}/permissions`)
  },

  assignPermissionsToRole: async (id: string, data: AssignPermissionsDto): Promise<void> => {
    return apiClient.post(`/admin/rbac/roles/${id}/permissions`, data)
  },

  removePermissionFromRole: async (id: string, permissionId: string): Promise<void> => {
    return apiClient.delete(`/admin/rbac/roles/${id}/permissions/${permissionId}`)
  },

  // Admin Permissions
  getAdminPermissions: async (id: string): Promise<Permission[]> => {
    return apiClient.get<Permission[]>(`/admin/rbac/admins/${id}/permissions`)
  },

  assignPermissionsToAdmin: async (id: string, data: AssignPermissionsDto): Promise<void> => {
    return apiClient.post(`/admin/rbac/admins/${id}/permissions`, data)
  },

  removePermissionFromAdmin: async (id: string, permissionId: string): Promise<void> => {
    return apiClient.delete(`/admin/rbac/admins/${id}/permissions/${permissionId}`)
  },
}

