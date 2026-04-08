import { Link } from 'react-router-dom'
import { User } from '@/types/auth/auth'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import {
    HiOutlineBars3,
    HiOutlineXMark,
    HiChevronDown,
    HiOutlineUserCircle,
    HiOutlineArrowRightOnRectangle,
} from 'react-icons/hi2'
import { cn } from '@/lib/utils'

interface HeaderProps {
    sidebarOpen: boolean
    setSidebarOpen: (value: boolean | ((prev: boolean) => boolean)) => void
    sidebarCollapsed: boolean
    setSidebarCollapsed: (value: boolean | ((prev: boolean) => boolean)) => void
    user: User | null
    logout: () => void
}

export function Header({
    sidebarOpen,
    setSidebarOpen,
    sidebarCollapsed,
    setSidebarCollapsed,
    user,
    logout,
}: HeaderProps) {
    const getInitials = (user: User | null) => {
        if (!user) return 'AD'
        if (user.firstname && user.lastname) {
            return `${user.firstname[0]}${user.lastname[0]}`.toUpperCase()
        }
        if (user.firstname) {
            return user.firstname.slice(0, 2).toUpperCase()
        }
        if (user.email) {
            return user.email.slice(0, 2).toUpperCase()
        }
        return 'AD'
    }

    const getUserDisplayName = (user: User | null) => {
        if (!user) return 'Admin'
        if (user.firstname && user.lastname) {
            return `${user.firstname} ${user.lastname}`
        }
        if (user.firstname) {
            return user.firstname
        }
        return user.email
    }

    const getUserRoleName = (user: User | null) => {
        if (!user) return ''
        const roleName = typeof user.role === 'string' ? user.role : user.role?.name || ''
        return roleName.replace(/_/g, ' ')
    }

    const getFormattedRole = (user: User | null) => {
        return getUserRoleName(user)
    }

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border/50 bg-background/95 backdrop-blur-sm shadow-sm px-4 lg:px-6">
            {/* Mobile Menu Button */}
            {!sidebarOpen && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden hover:bg-accent transition-colors"
                    onClick={() => setSidebarOpen(true)}
                    aria-label="Open sidebar"
                >
                    <HiOutlineBars3 className="h-5 w-5" />
                </Button>
            )}

            {/* Desktop Toggle Button */}
            {sidebarOpen && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="hover:bg-accent transition-colors lg:flex hidden"
                    onClick={() => setSidebarCollapsed((prev) => !prev)}
                    aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    {sidebarCollapsed ? (
                        <HiOutlineBars3 className="h-5 w-5" />
                    ) : (
                        <HiOutlineXMark className="h-5 w-5" />
                    )}
                </Button>
            )}

            {/* Mobile Menu Button - can be added here if needed, or kept in layout */}

            <div className="flex flex-1 items-center justify-end gap-3">
                {/* Theme Toggle */}
                <ThemeToggle />

                {/* User Menu */}
                {user && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-10 gap-2 hover:bg-accent transition-all duration-200 rounded-lg px-2 sm:px-4">
                                <Avatar className="h-8 w-8 ring-2 ring-primary/20 transition-all duration-200 hover:ring-primary/40">
                                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-semibold">
                                        {getInitials(user)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="hidden sm:flex sm:flex-col items-start text-left text-sm">
                                    <span className="font-medium max-w-[120px] truncate">{getUserDisplayName(user)}</span>
                                    <Badge variant="secondary" className="text-[10px] py-0 px-1.5 mt-0.5 font-normal">
                                        {getFormattedRole(user)}
                                    </Badge>
                                </div>
                                <HiChevronDown className="h-4 w-4 text-muted-foreground hidden sm:block" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 shadow-lg border-border/50 glassmorphism">
                            <DropdownMenuLabel className="pb-2">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-semibold truncate">{user.email}</p>
                                    <Badge variant="secondary" className="text-[10px] w-fit font-normal">
                                        {getFormattedRole(user)}
                                    </Badge>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild className="cursor-pointer">
                                <Link to="/profile" className="flex items-center w-full">
                                    <HiOutlineUserCircle className="mr-2 h-4 w-4" />
                                    Profile
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={logout} className="text-destructive cursor-pointer focus:text-destructive">
                                <HiOutlineArrowRightOnRectangle className="mr-2 h-4 w-4" />
                                Logout
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
        </header>
    )
}
