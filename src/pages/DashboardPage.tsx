import { useQuery } from '@tanstack/react-query'
import { systemApi } from '@/api/endpoints/system/system'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/layout/PageHeader'
import { useAuthStore } from '@/stores/auth'
import { HiOutlineUsers, HiOutlineCheckBadge, HiOutlineExclamationTriangle, HiOutlineBolt } from 'react-icons/hi2'

export default function DashboardPage() {
  const { user } = useAuthStore()

  const { data: statsData } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => systemApi.getStats(),
  })

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const getUserDisplayName = () => {
    if (!user) return 'Admin'
    return user.name || 'Admin'
  }

  const stats = [
    {
      label: 'Partners',
      value: statsData?.partners?.total || '0',
      icon: HiOutlineUsers,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    },
    {
      label: 'Verified KYC',
      value: statsData?.kyc?.verified || '0',
      icon: HiOutlineCheckBadge,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900/20',
    },
    {
      label: 'Pending KYC',
      value: statsData?.kyc?.pending || '0',
      icon: HiOutlineExclamationTriangle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20',
    },
    {
      label: 'Webhook Logs',
      value: statsData?.webhooks?.total || '0',
      icon: HiOutlineBolt,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
    },
  ]

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title={
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              {getGreeting()}, {getUserDisplayName()}!
            </h1>
            <p className="text-muted-foreground text-base">Welcome to your new Admin Dashboard</p>
          </div>
        }
        description=""
      />

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, idx) => (
          <Card key={idx} className="premium-card px-6 pt-5 pb-6 border-border/40">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-muted-foreground">{stat.label}</p>
              <div className={`rounded-full p-2.5 ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-bold tracking-tight">{stat.value}</span>
            </div>
          </Card>
        ))}
      </div>

      <Card className="border-border/40 overflow-hidden">
        <CardContent className="p-0">
          <div className="p-6 bg-muted/30">
            <h3 className="text-lg font-semibold mb-2">Getting Started</h3>
            <p className="text-sm text-muted-foreground">
              This is a clean startup template. You can start by adding your own modules and connecting to your API.
            </p>
          </div>
          <div className="p-6 border-t border-border/40">
            <ul className="space-y-4">
              <li className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">1</div>
                <div>
                  <h4 className="text-sm font-semibold">Customize Branding</h4>
                  <p className="text-xs text-muted-foreground">Update the Logo component and configuration files.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">2</div>
                <div>
                  <h4 className="text-sm font-semibold">Set Up API</h4>
                  <p className="text-xs text-muted-foreground">Configure your base URL in the .env file.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">3</div>
                <div>
                  <h4 className="text-sm font-semibold">Build Modules</h4>
                  <p className="text-xs text-muted-foreground">Create new folders in src/pages and src/api/endpoints.</p>
                </div>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
