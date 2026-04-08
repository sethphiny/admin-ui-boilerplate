import { apiClient } from '../../client'
import {
  ModulesResponse,
  RolesResponse,
  RoleResponse,
  CreateRoleDto,
  UpdateRoleDto,
  AssignPermissionsDto,
  UpdatePermissionDto,
  CreateRoleResponse,
  UpdateRoleResponse,
  PermissionResponse,
} from '@/types/permissions/permissions'
// TODO: Update API endpoints to match your backend routes
export const permissionsApi = {
  // Get all modules
  getModules: async (): Promise<ModulesResponse> => {
    return apiClient.get('/permissions/modules')
  },

  // Get all roles
  getRoles: async (): Promise<RolesResponse> => {
    return apiClient.get('/permissions/roles')
  },

  // Get role by ID with permissions
  getRoleById: async (id: string): Promise<RoleResponse> => {
    return apiClient.get(`/permissions/roles/${id}`)
  },

  // Create role
  createRole: async (dto: CreateRoleDto): Promise<CreateRoleResponse> => {
    return apiClient.post('/permissions/roles', dto)
  },

  // Update role
  updateRole: async (id: string, dto: UpdateRoleDto): Promise<UpdateRoleResponse> => {
    return apiClient.put(`/permissions/roles/${id}`, dto)
  },

  // Delete role
  deleteRole: async (id: string): Promise<void> => {
    return apiClient.delete(`/permissions/roles/${id}`)
  },

  // Assign permissions
  assignPermissions: async (roleId: string, dto: AssignPermissionsDto): Promise<void> => {
    return apiClient.post(`/permissions/roles/${roleId}/permissions`, dto)
  },

  // Update single permission
  updatePermission: async (
    roleId: string,
    moduleId: string,
    dto: UpdatePermissionDto
  ): Promise<PermissionResponse> => {
    return apiClient.put(`/permissions/roles/${roleId}/permissions/${moduleId}`, dto)
  },

  // Remove permission
  removePermission: async (roleId: string, moduleId: string): Promise<void> => {
    return apiClient.delete(`/permissions/roles/${roleId}/permissions/${moduleId}`)
  },
}

