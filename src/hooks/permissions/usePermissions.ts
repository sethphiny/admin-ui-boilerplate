import { useAuthStore } from '@/stores/auth'
import { AccessLevel } from '@/types/auth/permissions'
import { useCurrentAdminPermissions } from '../admin/useCurrentAdminPermissions'

/**
 * Hook to check user permissions based on resource.action format from User.role.permissions
 */
export function usePermissions() {
  const { user } = useAuthStore()
  const { permissionMap, isSuperAdmin: isSuperAdminFromPermissions, isLoading } = useCurrentAdminPermissions()

  // Map navigation module names to permission resource names
  const moduleToResourceMap: Record<string, string> = {
    dashboard: 'dashboard',
    user: 'user',
    wallet: 'wallet',
    payment: 'payment',
    transaction: 'transaction',
    swap: 'swap',
    kyc: 'verification', // KYC module maps to verification resource
    approval: 'approval',
    role: 'role',
    permission: 'permission',
    admin: 'admin',
    system: 'system',
    provider: 'provider',
    activity: 'activity',
    flight: 'flight',
    'thresh0ld-withdrawal': 'thresh0ld-withdrawal',
  }

  const isSuperAdmin = (): boolean => {
    if (!user) return false
    return isSuperAdminFromPermissions
  }

  /**
   * Check if user has access to a module with the required access level
   * @param moduleKey - The module key from navigation (e.g., 'user', 'wallet')
   * @param requiredLevel - Required access level (READ or WRITE)
   * @param subResource - Optional sub-resource (e.g., 'whitelist' for 'thresh0ld-withdrawal.whitelist')
   * @returns true if user has sufficient access
   */
  const hasModuleAccess = (
    moduleKey: string,
    requiredLevel: AccessLevel = AccessLevel.READ,
    subResource?: string
  ): boolean => {
    // Super admin bypasses all checks
    if (isSuperAdmin()) return true

    if (!user) return false

    // Dashboard is always accessible to authenticated users
    if (moduleKey.toLowerCase() === 'dashboard') {
      return true
    }

    // Map module key to resource name
    const resourceName = moduleToResourceMap[moduleKey.toLowerCase()] || moduleKey.toLowerCase()

    // Check for sub-resource permission first (e.g., thresh0ld-withdrawal.whitelist.read)
    if (subResource) {
      const subResourceKey = `${resourceName}.${subResource}`
      const subResourceAccessLevel = permissionMap.get(subResourceKey)
      
      if (subResourceAccessLevel && subResourceAccessLevel !== AccessLevel.NONE) {
        // WRITE access includes READ access
        if (requiredLevel === AccessLevel.READ) {
          return subResourceAccessLevel === AccessLevel.READ || subResourceAccessLevel === AccessLevel.WRITE
        }
        // For WRITE access, user must have WRITE permission
        return subResourceAccessLevel === AccessLevel.WRITE
      }
    }

    // Fall back to parent resource permission (e.g., thresh0ld-withdrawal.read)
    const userAccessLevel = permissionMap.get(resourceName)

    // If no permission found, deny access
    if (!userAccessLevel || userAccessLevel === AccessLevel.NONE) {
      return false
    }

    // WRITE access includes READ access
    if (requiredLevel === AccessLevel.READ) {
      return userAccessLevel === AccessLevel.READ || userAccessLevel === AccessLevel.WRITE
    }

    // For WRITE access, user must have WRITE permission
    return userAccessLevel === AccessLevel.WRITE
  }

  return {
    user,
    isSuperAdmin,
    hasModuleAccess,
    isLoading,
  }
}

