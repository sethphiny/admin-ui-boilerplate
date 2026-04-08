import { useMemo } from 'react'
import { useAuthStore } from '@/stores/auth'
import { AccessLevel } from '@/types/permissions/permissions'

/**
 * Hook to extract and map the current user's permissions from User.role.permissions
 * Maps resource.action format (e.g., "user.read") to module names with access levels
 */
export function useCurrentAdminPermissions() {
  const { user } = useAuthStore()

  // Map resource.action permissions to module names with access levels
  const { permissionMap, isSuperAdmin } = useMemo(() => {
    const map = new Map<string, AccessLevel>()
    let superAdmin = false

    if (!user?.role) {
      return { permissionMap: map, isSuperAdmin: false }
    }

    // Check if user is super admin
    const roleName = typeof user.role === 'string' ? user.role : user.role.name
    superAdmin = roleName === 'SUPER_ADMIN' || roleName === 'SUPERADMIN'

    // Extract permissions from user.role.permissions
    const permissions = typeof user.role === 'object' ? user.role.permissions : []

    if (permissions && Array.isArray(permissions)) {
      permissions.forEach((permission) => {
        // Permission format: { resource: "user", action: "read" }
        const resource = permission.resource?.toLowerCase()
        const action = permission.action?.toLowerCase()

        if (!resource) return

        // Map actions to access levels
        // Read actions: read, view, list, get
        // Write actions: create, update, delete, suspend, activate, freeze, credit, etc.
        const isReadAction = ['read', 'view', 'list', 'get'].includes(action)
        const isWriteAction = [
          'create',
          'update',
          'delete',
          'suspend',
          'activate',
          'freeze',
          'unfreeze',
          'credit',
          'debit',
          'approve',
          'reject',
          'reverse',
          'refund',
        ].includes(action)

        if (isReadAction) {
          // Set READ if not already set, or upgrade to WRITE if write action exists
          const current = map.get(resource)
          if (!current || current === AccessLevel.NONE) {
            map.set(resource, AccessLevel.READ)
          }
        } else if (isWriteAction) {
          // Write actions always set WRITE level
          map.set(resource, AccessLevel.WRITE)
        }
      })
    }

    return { permissionMap: map, isSuperAdmin: superAdmin }
  }, [user])

  return {
    permissionMap,
    isSuperAdmin,
    isLoading: false,
    error: null,
  }
}

