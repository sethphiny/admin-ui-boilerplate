import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import { usePermissions } from '@/hooks/permissions/usePermissions'
import { Sidebar, NavItem } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { AccessLevel } from '@/types/auth/permissions'
import {
  HiOutlineSquares2X2,
  HiOutlineUsers,
  HiOutlineShieldCheck,
  HiOutlineClipboardDocumentList,
  HiOutlineGlobeAlt,
} from 'react-icons/hi2'
import { cn } from '@/lib/utils'

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: HiOutlineSquares2X2,
    module: 'dashboard',
    accessLevel: AccessLevel.READ,
  },
  {
    label: 'Partners',
    href: '/partners',
    icon: HiOutlineUsers,
    module: 'partner',
    accessLevel: AccessLevel.READ,
  },
  {
    label: 'KYC Sessions',
    href: '/kyc',
    icon: HiOutlineShieldCheck,
    module: 'kyc',
    accessLevel: AccessLevel.READ,
  },
  {
    label: 'Webhooks',
    icon: HiOutlineGlobeAlt,
    module: 'webhook',
    accessLevel: AccessLevel.READ,
    children: [
      {
        label: 'Stats (Providers)',
        href: '/webhooks',
        icon: HiOutlineSquares2X2,
        module: 'webhook',
        accessLevel: AccessLevel.READ,
      },
      {
        label: 'Logs (Incoming)',
        href: '/webhook-logs',
        icon: HiOutlineClipboardDocumentList,
        module: 'webhook',
        accessLevel: AccessLevel.READ,
      },
    ],
  },
]

export default function DashboardLayout() {
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const { hasModuleAccess } = usePermissions()
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window === 'undefined') return true
    return window.matchMedia('(min-width: 1024px)').matches
  })
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  useEffect(() => {
    const mql = window.matchMedia('(min-width: 1024px)')
    const onMqlChange = (e: MediaQueryListEvent) => {
      setSidebarOpen(e.matches)
    }

    mql.addEventListener('change', onMqlChange)
    return () => mql.removeEventListener('change', onMqlChange)
  }, [])

  const isItemOrChildActive = (item: NavItem): boolean => {
    if (item.href) {
      const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/')
      if (isActive) return true
    }
    if (item.children) {
      return item.children.some((child) => isItemOrChildActive(child))
    }
    return false
  }

  const filterNavItems = (items: NavItem[]): NavItem[] => {
    return items
      .map((item) => {
        const hasAccess = hasModuleAccess(item.module, item.accessLevel || AccessLevel.READ)
        if (!hasAccess) return null

        const filteredChildren = item.children ? filterNavItems(item.children) : undefined

        if (item.children) {
          if (!filteredChildren || filteredChildren.length === 0) return null
          return { ...item, children: filteredChildren }
        }

        return item
      })
      .filter((item): item is NavItem => item !== null)
  }

  const filteredNavItems = filterNavItems(navItems)

  const shouldBeExpanded = (item: NavItem): boolean => {
    if (!item.children) return false
    return item.children.some((child) => {
      if (child.href) {
        return location.pathname === child.href || location.pathname.startsWith(child.href + '/')
      }
      return false
    })
  }

  const toggleExpanded = (label: string) => {
    setExpandedItems((prev) => {
      const next = new Set<string>()
      if (!prev.has(label)) {
        next.add(label)
      }
      return next
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex overflow-hidden">
      <Sidebar
        sidebarOpen={sidebarOpen}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarOpen={setSidebarOpen}
        filteredNavItems={filteredNavItems}
        expandedItems={expandedItems}
        toggleExpanded={toggleExpanded}
        isItemOrChildActive={isItemOrChildActive}
        shouldBeExpanded={shouldBeExpanded}
        user={user}
      />

      <div className={cn(
        'flex-1 flex flex-col transition-all duration-300 ease-out h-screen overflow-hidden',
        sidebarOpen
          ? (sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64')
          : 'lg:pl-0'
      )}>
        <Header
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
          user={user}
          logout={logout}
        />

        <main className="flex-1 overflow-y-auto p-4 lg:p-6 animate-in fade-in duration-500 scrollbar-thin">
          <div className="max-w-[1600px] mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-background/60 backdrop-blur-sm transition-all duration-300 ease-out lg:hidden animate-in fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}
