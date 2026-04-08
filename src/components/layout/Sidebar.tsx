import { ElementType } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import Logo from '@/components/layout/Logo'
import { HiChevronDown, HiOutlineUserCircle } from 'react-icons/hi2'
import { cn } from '@/lib/utils'
import { AccessLevel } from '@/types/permissions/permissions'
import { User } from '@/types/auth/auth'

export interface NavItem {
    label: string
    href?: string
    icon: ElementType
    module: string
    accessLevel?: AccessLevel
    children?: NavItem[]
}

interface SidebarProps {
    sidebarOpen: boolean
    sidebarCollapsed: boolean
    setSidebarOpen: (open: boolean) => void
    filteredNavItems: NavItem[]
    expandedItems: Set<string>
    toggleExpanded: (label: string) => void
    isItemOrChildActive: (item: NavItem) => boolean
    shouldBeExpanded: (item: NavItem) => boolean
    user: User | null
}

export function Sidebar({
    sidebarOpen,
    sidebarCollapsed,
    setSidebarOpen,
    filteredNavItems,
    expandedItems,
    toggleExpanded,
    isItemOrChildActive,
    shouldBeExpanded,
    user,
}: SidebarProps) {
    const location = useLocation()

    return (
        <aside
            className={cn(
                'fixed left-0 top-0 z-40 h-screen border-r bg-card/95 backdrop-blur-sm shadow-xl transition-all duration-300 ease-out will-change-transform',
                sidebarOpen ? 'translate-x-0' : '-translate-x-full',
                sidebarCollapsed ? 'w-16' : 'w-64'
            )}
        >
            <div className="flex h-full flex-col bg-gradient-to-b from-card to-card/50">
                <div className={cn(
                    "flex h-16 items-center border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent transition-all duration-300",
                    sidebarCollapsed ? "justify-center px-2" : "justify-between px-6"
                )}>
                    {!sidebarCollapsed && (
                        <div className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                            <Logo className="h-8 font-bold" />
                        </div>
                    )}
                    {sidebarCollapsed && (
                        <div className="flex items-center justify-center w-full">
                            <Logo className="h-8 w-8" clickable={false} />
                        </div>
                    )}
                </div>

                <nav className={cn(
                    "flex-1 space-y-1 overflow-y-auto sidebar-scrollbar transition-all duration-300",
                    sidebarCollapsed ? "p-2" : "p-4"
                )}>
                    {filteredNavItems.map((item) => {
                        const Icon = item.icon
                        const hasChildren = item.children && item.children.length > 0
                        const isParentActive = isItemOrChildActive(item)
                        const isExpanded = expandedItems.has(item.label) || shouldBeExpanded(item)

                        if (hasChildren) {
                            if (sidebarCollapsed) {
                                return (
                                    <TooltipProvider key={item.label}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <button
                                                                className={cn(
                                                                    'group flex w-full items-center justify-center rounded-lg p-2.5 text-sm font-medium transition-all duration-200 relative hover:bg-accent/50',
                                                                    isParentActive
                                                                        ? 'text-primary bg-primary/10'
                                                                        : 'text-muted-foreground hover:text-foreground'
                                                                )}
                                                            >
                                                                {isParentActive && (
                                                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-primary rounded-r-full transition-all duration-200 ease-out" />
                                                                )}
                                                                <Icon className={cn(
                                                                    'h-5 w-5 transition-transform duration-200',
                                                                    isParentActive ? 'scale-110' : 'group-hover:scale-110'
                                                                )} />
                                                            </button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent side="right" align="start" className="w-56 glassmorphism border-primary/20">
                                                            <DropdownMenuLabel>{item.label}</DropdownMenuLabel>
                                                            <DropdownMenuSeparator />
                                                            {item.children!.map((child) => {
                                                                const ChildIcon = child.icon
                                                                const exactMatch = item.children!.find((c) => c.href && location.pathname === c.href)
                                                                const isChildActive =
                                                                    child.href &&
                                                                    (location.pathname === child.href ||
                                                                        (!exactMatch && location.pathname.startsWith(child.href + '/')))
                                                                return (
                                                                    <DropdownMenuItem key={child.href || child.label} asChild>
                                                                        <Link
                                                                            to={child.href || '#'}
                                                                            className={cn(
                                                                                'flex items-center gap-3 cursor-pointer py-2',
                                                                                isChildActive && 'bg-primary/10 text-primary font-medium'
                                                                            )}
                                                                            onClick={() => {
                                                                                if (window.innerWidth < 1024) {
                                                                                    setSidebarOpen(false)
                                                                                }
                                                                            }}
                                                                        >
                                                                            <ChildIcon className="h-4 w-4" />
                                                                            <span>{child.label}</span>
                                                                        </Link>
                                                                    </DropdownMenuItem>
                                                                )
                                                            })}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent side="right">
                                                <p>{item.label}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                )
                            }

                            return (
                                <div key={item.label} className="animate-in fade-in slide-in-from-left-2 duration-300">
                                    <div className="space-y-1">
                                        <button
                                            onClick={() => toggleExpanded(item.label)}
                                            className={cn(
                                                'group flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 relative hover:bg-accent/50',
                                                isParentActive
                                                    ? 'text-primary bg-primary/5'
                                                    : 'text-muted-foreground hover:text-foreground'
                                            )}
                                        >
                                            {isParentActive && (
                                                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-primary rounded-r-full transition-all duration-200 ease-out" />
                                            )}
                                            <div className="flex flex-1 items-center gap-3">
                                                <Icon className={cn(
                                                    'h-5 w-5 transition-transform duration-200',
                                                    isParentActive ? 'scale-110' : 'group-hover:scale-110'
                                                )} />
                                                <span className="font-medium">{item.label}</span>
                                            </div>
                                            <HiChevronDown className={cn(
                                                'h-4 w-4 transition-transform duration-200 flex-shrink-0',
                                                isExpanded ? 'rotate-0' : '-rotate-90',
                                                isParentActive
                                                    ? 'text-primary'
                                                    : 'text-muted-foreground'
                                            )} />
                                        </button>
                                        {isExpanded && (
                                            <div className="ml-4 space-y-1 border-l-2 border-primary/10 pl-3 animate-in slide-in-from-top-2 duration-200">
                                                {item.children!.map((child) => {
                                                    const ChildIcon = child.icon
                                                    const exactMatch = item.children!.find((c) => c.href && location.pathname === c.href)
                                                    const isChildActive =
                                                        child.href &&
                                                        (location.pathname === child.href ||
                                                            (!exactMatch && location.pathname.startsWith(child.href + '/')))
                                                    return (
                                                        <Link
                                                            key={child.href || child.label}
                                                            to={child.href || '#'}
                                                            className={cn(
                                                                'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ease-out relative',
                                                                isChildActive
                                                                    ? 'bg-primary/10 text-primary font-semibold scale-[1.02] shadow-sm'
                                                                    : 'text-muted-foreground hover:bg-accent/40 hover:text-foreground hover:scale-[1.01]'
                                                            )}
                                                            onClick={() => {
                                                                if (window.innerWidth < 1024) {
                                                                    setSidebarOpen(false)
                                                                }
                                                            }}
                                                        >
                                                            {isChildActive && (
                                                                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-primary rounded-r-full transition-all duration-200 ease-out" />
                                                            )}
                                                            <ChildIcon className={cn(
                                                                'h-4 w-4 transition-transform duration-200',
                                                                isChildActive ? 'scale-110' : 'group-hover:scale-110'
                                                            )} />
                                                            <span>{child.label}</span>
                                                        </Link>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        }

                        const isActive = item.href && (location.pathname === item.href || location.pathname.startsWith(item.href + '/'))

                        if (sidebarCollapsed) {
                            return (
                                <TooltipProvider key={item.href || item.label}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Link
                                                to={item.href || '#'}
                                                className={cn(
                                                    'group flex items-center justify-center rounded-lg p-2.5 text-sm font-medium transition-all duration-200 ease-out relative',
                                                    isActive
                                                        ? 'bg-primary/10 text-primary font-semibold shadow-sm'
                                                        : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                                                )}
                                                onClick={() => {
                                                    if (window.innerWidth < 1024) {
                                                        setSidebarOpen(false)
                                                    }
                                                }}
                                            >
                                                {isActive && (
                                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-primary rounded-r-full transition-all duration-200 ease-out" />
                                                )}
                                                <Icon className={cn(
                                                    'h-5 w-5 transition-transform duration-200',
                                                    isActive ? 'scale-110' : 'group-hover:scale-110'
                                                )} />
                                            </Link>
                                        </TooltipTrigger>
                                        <TooltipContent side="right">
                                            <p>{item.label}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )
                        }

                        return (
                            <div key={item.href || item.label} className="animate-in fade-in slide-in-from-left-2 duration-300">
                                <Link
                                    to={item.href || '#'}
                                    className={cn(
                                        'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ease-out relative',
                                        isActive
                                            ? 'bg-primary/10 text-primary font-semibold shadow-sm scale-[1.02]'
                                            : 'text-muted-foreground hover:bg-accent/40 hover:text-foreground hover:scale-[1.01]'
                                    )}
                                    onClick={() => {
                                        if (window.innerWidth < 1024) {
                                            setSidebarOpen(false)
                                        }
                                    }}
                                >
                                    {isActive && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-primary rounded-r-full transition-all duration-200 ease-out" />
                                    )}
                                    <Icon className={cn(
                                        'h-5 w-5 transition-transform duration-200',
                                        isActive ? 'scale-110' : 'group-hover:scale-110'
                                    )} />
                                    <span className="font-medium">{item.label}</span>
                                </Link>
                            </div>
                        )
                    })}
                </nav>

                <div className={cn(
                    "border-t border-border/50 bg-gradient-to-t from-card to-transparent transition-all duration-300",
                    sidebarCollapsed ? "p-2" : "p-4"
                )}>
                    {sidebarCollapsed ? (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Link
                                        to="/profile"
                                        className={cn(
                                            'group flex items-center justify-center rounded-lg p-2.5 text-sm font-medium transition-all duration-200 ease-out relative',
                                            location.pathname === '/profile'
                                                ? 'bg-primary/10 text-primary font-semibold shadow-sm'
                                                : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                                        )}
                                        onClick={() => {
                                            if (window.innerWidth < 1024) {
                                                setSidebarOpen(false)
                                            }
                                        }}
                                    >
                                        {location.pathname === '/profile' && (
                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-primary rounded-r-full transition-all duration-200 ease-out" />
                                        )}
                                        <HiOutlineUserCircle className={cn(
                                            'h-5 w-5 transition-transform duration-200',
                                            location.pathname === '/profile' ? 'scale-110' : 'group-hover:scale-110'
                                        )} />
                                    </Link>
                                </TooltipTrigger>
                                <TooltipContent side="right">
                                    <p>Profile</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    ) : (
                        <Link
                            to="/profile"
                            className={cn(
                                'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ease-out relative',
                                location.pathname === '/profile'
                                    ? 'bg-primary/10 text-primary font-semibold shadow-sm scale-[1.02]'
                                    : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground hover:scale-[1.01]'
                            )}
                            onClick={() => {
                                if (window.innerWidth < 1024) {
                                    setSidebarOpen(false)
                                }
                            }}
                        >
                            {location.pathname === '/profile' && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-primary rounded-r-full transition-all duration-200 ease-out" />
                            )}
                            <HiOutlineUserCircle className={cn(
                                'h-5 w-5 transition-transform duration-200',
                                location.pathname === '/profile' ? 'scale-110' : 'group-hover:scale-110'
                            )} />
                            <span className="font-medium">Profile</span>
                        </Link>
                    )}
                </div>
            </div>
        </aside>
    )
}
