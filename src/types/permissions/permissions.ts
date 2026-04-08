// Permission Types
export enum AccessLevel {
  READ = 'READ',
  WRITE = 'WRITE',
  NONE = 'NONE',
}

// Module Interface
export interface AdminModule {
  id: string
  moduleKey: string
  moduleName: string
  controllerPath: string
  description?: string
  isActive: boolean
  autoDiscovered: boolean
  createdOn: string
  updatedOn: string
}

// Role Interface (for RBAC system)
export interface RBACRole {
  id: string
  name: string
  description?: string
  isSystemRole: boolean
  createdOn: string
  updatedOn: string
}

// Permission Interface
export interface AdminRolePermission {
  id: string
  roleId: string
  moduleId: string
  module?: AdminModule
  accessLevel: AccessLevel
  createdOn: string
  updatedOn: string
}

// Role with Permissions
export interface RBACRoleWithPermissions extends RBACRole {
  permissions: AdminRolePermission[]
}

// DTOs
export interface CreateRoleDto {
  name: string
  description?: string
}

export interface UpdateRoleDto {
  name?: string
  description?: string
}

export interface AssignPermissionDto {
  moduleId: string
  accessLevel: AccessLevel
}

export interface AssignPermissionsDto {
  permissions: AssignPermissionDto[]
}

export interface UpdatePermissionDto {
  accessLevel: AccessLevel
}

// API Response Types
export interface ModulesResponse {
  modules: AdminModule[]
}

export interface RolesResponse {
  roles: RBACRole[]
}

export interface RoleResponse {
  role: RBACRoleWithPermissions
}

export interface CreateRoleResponse {
  role: RBACRole
}

export interface UpdateRoleResponse {
  role: RBACRole
}

export interface PermissionResponse {
  permission: AdminRolePermission
}

