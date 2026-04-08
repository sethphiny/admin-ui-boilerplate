import { ReactNode } from 'react'
import { usePermissions } from '@/hooks/permissions/usePermissions'
import { AccessLevel } from '@/types/permissions/permissions'

interface PermissionGateProps {
  children: ReactNode
  // Module-based props (preferred)
  module?: string // module key (e.g., 'users', 'settings', 'reports')
  accessLevel?: AccessLevel // default: READ
  subResource?: string // Optional sub-resource (e.g., 'whitelist' for 'thresh0ld-withdrawal.whitelist')
  // Legacy props for backward compatibility (if you use role-based permissions)
  requiredRoles?: string[] // TODO: Update type based on your role system
  fallback?: ReactNode
}

/**
 * PermissionGate component - conditionally renders children based on permissions
 * 
 * Usage:
 * <PermissionGate module="users" accessLevel={AccessLevel.WRITE}>
 *   <Button>Delete User</Button>
 * </PermissionGate>
 */
export default function PermissionGate({
  children,
  module,
  accessLevel = AccessLevel.READ,
  subResource,
  requiredRoles,
  fallback = null,
}: PermissionGateProps) {
  const { hasModuleAccess } = usePermissions()

  let hasAccess = false

  // Use module-based check if module is provided (preferred)
  if (module) {
    hasAccess = hasModuleAccess(module, accessLevel, subResource)
  } 
  // Fall back to role-based check for backward compatibility
  else if (requiredRoles && requiredRoles.length > 0) {
    // TODO: Implement role-based check if you use roles instead of modules
    // Example:
    // const { user } = useAuthStore()
    // hasAccess = requiredRoles.includes(user?.role || '')
    hasAccess = false
  }
  // If neither is provided, deny access
  else {
    hasAccess = false
  }

  if (!hasAccess) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

