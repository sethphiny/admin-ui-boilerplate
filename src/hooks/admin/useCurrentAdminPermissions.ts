import { useMemo } from 'react'
import { useAuthStore } from '@/stores/auth'
import { AccessLevel } from '@/types/auth/permissions'

/**
 * Hook to extract and map the current user's permissions from User.role.permissions
 * Maps resource.action format (e.g., "user.read") to module names with access levels
 */
export function useCurrentAdminPermissions() {
  const { user } = useAuthStore()

  // Map Admin roles to access levels
  const { permissionMap, isSuperAdmin } = useMemo(() => {
    const map = new Map<string, AccessLevel>()
    let superAdmin = false

    if (!user) {
      return { permissionMap: map, isSuperAdmin: false }
    }

    const role = (user as any).role as string
    superAdmin = role === 'SUPER_ADMIN'

    // Define broad permissions based on role
    // For now, ADMIN has WRITE for everything, VIEWER has READ for everything
    const modules = ['partner', 'kyc', 'webhook', 'dashboard']
    
    modules.forEach(module => {
      if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
        map.set(module, AccessLevel.WRITE)
      } else if (role === 'VIEWER') {
        map.set(module, AccessLevel.READ)
      }
    })

    return { permissionMap: map, isSuperAdmin: superAdmin }
  }, [user])

  return {
    permissionMap,
    isSuperAdmin,
    isLoading: false,
    error: null,
  }
}

