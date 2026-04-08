import { useState, useMemo } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { WebhookProviderStats } from '@/components/webhooks/WebhookProviderStats'
import { WebhookEventsTable } from '@/components/webhooks/WebhookEventsTable'
import { FailedWebhooksView } from '@/components/webhooks/FailedWebhooksView'
import { PermissionError } from '@/components/misc/PermissionError'
import { isPermissionError, handleApiError } from '@/lib/errorHandler'
import { useQuery } from '@tanstack/react-query'
import { webhooksApi } from '@/api/endpoints/webhooks/webhooks'
import {
  HiOutlineGlobeAlt,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineClock,
  HiOutlineArrowTrendingUp,
  HiOutlineArrowTrendingDown,
  HiOutlineChartBar,
} from 'react-icons/hi2'

export default function WebhooksPage() {
  const [pagaStartDate, setPagaStartDate] = useState<Date | undefined>()
  const [pagaEndDate, setPagaEndDate] = useState<Date | undefined>()
  const [thresh0ldStartDate, setThresh0ldStartDate] = useState<Date | undefined>()
  const [thresh0ldEndDate, setThresh0ldEndDate] = useState<Date | undefined>()

  // Fetch stats for both providers
  const { data: pagaStats, isLoading: loadingPaga } = useQuery({
    queryKey: ['webhook-stats', 'paga', pagaStartDate, pagaEndDate],
    queryFn: () => {
      const start = pagaStartDate ? new Date(pagaStartDate) : undefined
      const end = pagaEndDate ? new Date(pagaEndDate) : undefined
      return webhooksApi.getProviderStats('paga', start, end)
    },
  })

  const { data: thresh0ldStats, isLoading: loadingThresh0ld } = useQuery({
    queryKey: ['webhook-stats', 'thresh0ld', thresh0ldStartDate, thresh0ldEndDate],
    queryFn: () => {
      const start = thresh0ldStartDate ? new Date(thresh0ldStartDate) : undefined
      const end = thresh0ldEndDate ? new Date(thresh0ldEndDate) : undefined
      return webhooksApi.getProviderStats('thresh0ld', start, end)
    },
  })

  // Calculate overall summary
  const overallSummary = useMemo(() => {
    const totalReceived = (pagaStats?.totalReceived || 0) + (thresh0ldStats?.totalReceived || 0)
    const totalCompleted = (pagaStats?.completed || 0) + (thresh0ldStats?.completed || 0)
    const totalFailed = (pagaStats?.failed || 0) + (thresh0ldStats?.failed || 0)
    const totalPending = (pagaStats?.pending || 0) + (thresh0ldStats?.pending || 0)
    const totalProcessing = (pagaStats?.processing || 0) + (thresh0ldStats?.processing || 0)
    
    const overallSuccessRate = totalReceived > 0 
      ? (totalCompleted / totalReceived) * 100 
      : 0

    return {
      totalReceived,
      totalCompleted,
      totalFailed,
      totalPending,
      totalProcessing,
      overallSuccessRate,
    }
  }, [pagaStats, thresh0ldStats])

  // Test query to check for permission errors
  const { error } = useQuery({
    queryKey: ['webhook-stats', 'paga'],
    queryFn: () => webhooksApi.getProviderStats('paga'),
    retry: false,
  })

  if (error && isPermissionError(error)) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Webhook Management"
          description="Monitor and manage webhook events from payment providers"
        />
        <PermissionError message={handleApiError(error)} variant="inline" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Webhook Management"
        description="Monitor and manage webhook events from payment providers"
      />

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="failed">Failed</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Overall Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Webhooks</CardTitle>
                <HiOutlineGlobeAlt className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loadingPaga || loadingThresh0ld ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      {overallSummary.totalReceived.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Across all providers
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <HiOutlineChartBar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loadingPaga || loadingThresh0ld ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <>
                    <div className="text-2xl font-bold flex items-center gap-2">
                      {overallSummary.totalReceived > 0
                        ? `${overallSummary.overallSuccessRate.toFixed(1)}%`
                        : 'N/A'}
                      {overallSummary.totalReceived > 0 && (
                        overallSummary.overallSuccessRate >= 95 ? (
                          <HiOutlineArrowTrendingUp className="h-4 w-4 text-green-600" />
                        ) : overallSummary.overallSuccessRate >= 90 ? (
                          <HiOutlineArrowTrendingUp className="h-4 w-4 text-yellow-600" />
                        ) : (
                          <HiOutlineArrowTrendingDown className="h-4 w-4 text-red-600" />
                        )
                      )}
                    </div>
                    <Badge
                      variant={
                        overallSummary.totalReceived === 0
                          ? 'secondary'
                          : overallSummary.overallSuccessRate >= 95
                            ? 'default'
                            : overallSummary.overallSuccessRate >= 90
                              ? 'secondary'
                              : 'destructive'
                      }
                      className="mt-1 text-xs"
                    >
                      {overallSummary.totalReceived === 0
                        ? 'No Data'
                        : overallSummary.overallSuccessRate >= 95
                          ? 'Excellent'
                          : overallSummary.overallSuccessRate >= 90
                            ? 'Good'
                            : 'Needs Attention'}
                    </Badge>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <HiOutlineCheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                {loadingPaga || loadingThresh0ld ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <>
                    <div className="text-2xl font-bold text-green-600">
                      {overallSummary.totalCompleted.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Successful webhooks
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Failed</CardTitle>
                <HiOutlineXCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                {loadingPaga || loadingThresh0ld ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <>
                    <div className="text-2xl font-bold text-red-600">
                      {overallSummary.totalFailed.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Failed webhooks
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <HiOutlineClock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                {loadingPaga || loadingThresh0ld ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <>
                    <div className="text-2xl font-bold text-yellow-600">
                      {overallSummary.totalPending.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Awaiting processing
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Provider Statistics */}
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
            <WebhookProviderStats
              provider="paga"
              startDate={pagaStartDate}
              endDate={pagaEndDate}
              onDateRangeChange={(start, end) => {
                setPagaStartDate(start)
                setPagaEndDate(end)
              }}
            />
            <WebhookProviderStats
              provider="thresh0ld"
              startDate={thresh0ldStartDate}
              endDate={thresh0ldEndDate}
              onDateRangeChange={(start, end) => {
                setThresh0ldStartDate(start)
                setThresh0ldEndDate(end)
              }}
            />
          </div>
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-4">
          <WebhookEventsTable />
        </TabsContent>

        {/* Failed Tab */}
        <TabsContent value="failed" className="space-y-4">
          <FailedWebhooksView />
        </TabsContent>
      </Tabs>
    </div>
  )
}
