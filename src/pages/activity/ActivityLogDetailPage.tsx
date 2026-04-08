import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { activityApi } from '@/api/endpoints/activity/activity'
import Loader from '@/components/misc/Loader'
import { PermissionError } from '@/components/misc/PermissionError'
import { isPermissionError, handleApiError } from '@/lib/errorHandler'
import { formatDateTime } from '@/lib/dateUtils'
import { HiOutlineArrowLeft, HiOutlineEye } from 'react-icons/hi2'

export default function ActivityLogDetailPage() {
  const { id, type } = useParams<{ id: string; type?: string }>()
  const navigate = useNavigate()

  const isAdminLog = type === 'admin'

  const { data: activityLog, isLoading, error } = useQuery({
    queryKey: ['activity-log', id, type],
    queryFn: () => {
      if (isAdminLog) {
        return activityApi.getAdminActivityLogById(id!)
      }
      return activityApi.getActivityLogById(id!)
    },
    enabled: !!id,
  })

  if (isLoading) {
    return <Loader fullScreen />
  }

  // Check for permission errors first
  if (error && isPermissionError(error)) {
    return (
      <PermissionError
        message={handleApiError(error)}
        variant="full"
        onGoBack={() => navigate('/activity')}
      />
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{handleApiError(error)}</p>
            <Button
              onClick={() => navigate('/activity')}
              variant="outline"
              className="mt-4"
            >
              <HiOutlineArrowLeft className="h-4 w-4 mr-2" />
              Back to Activity Logs
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!activityLog) {
    return <div>Activity log not found</div>
  }

  const formatDate = (dateString: string | undefined | null): string => {
    if (!dateString) return 'N/A'
    return formatDateTime(dateString, { second: '2-digit' })
  }

  const getStatusBadge = (status: string) => {
    const statusLower = (status || '').toLowerCase()
    const colorClass = statusLower === 'success' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800'
    return <Badge className={colorClass}>{status.toUpperCase()}</Badge>
  }

  const getOperationTypeBadge = (operationType: string | null | undefined) => {
    if (!operationType) return null
    const colors = {
      QUERY: 'bg-blue-100 text-blue-800',
      MUTATION: 'bg-orange-100 text-orange-800',
      SUBSCRIPTION: 'bg-purple-100 text-purple-800',
    }
    const colorClass = colors[operationType as keyof typeof colors] || 'bg-gray-100 text-gray-800'
    return <Badge className={colorClass}>{operationType}</Badge>
  }

  const formatResolverPath = (path: string[] | null | undefined): string => {
    if (!path || path.length === 0) return '-'
    return path.join(' → ')
  }

  const isGraphQLLog = !!(
    activityLog?.operationName ||
    activityLog?.operationType ||
    activityLog?.query ||
    activityLog?.variables
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Activity Log ${activityLog.id.slice(0, 8)}...`}
        description={`Action: ${activityLog.action} | Status: ${activityLog.status}`}
        actions={
          <Button variant="outline" onClick={() => navigate('/activity')}>
            <HiOutlineArrowLeft className="h-4 w-4 mr-2" />
            Back to Activity Logs
          </Button>
        }
      />

      {/* GraphQL Errors Alert */}
      {activityLog.graphqlErrors && activityLog.graphqlErrors.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">GraphQL Errors</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activityLog.graphqlErrors.map((error, index) => (
              <div key={index} className="bg-white rounded-lg p-4 border border-red-200">
                <div className="space-y-2">
                  <div>
                    <label className="text-sm font-medium text-red-800">Error Message</label>
                    <p className="text-sm text-red-700 break-all">{error.message}</p>
                  </div>
                  {error.path && error.path.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-red-800">Path</label>
                      <p className="text-sm font-mono text-red-700">{error.path.join(' → ')}</p>
                    </div>
                  )}
                  {error.extensions && Object.keys(error.extensions).length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-red-800">Extensions</label>
                      <div className="bg-muted rounded-lg p-3 overflow-auto max-h-48">
                        <pre className="text-xs font-mono whitespace-pre-wrap">
                          {JSON.stringify(error.extensions, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Log Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">ID</label>
              <p className="font-mono text-sm break-all">{activityLog.id}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Action</label>
              <div>
                <Badge variant="outline" className="font-mono">
                  {activityLog.action}
                </Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <div>{getStatusBadge(activityLog.status)}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Method</label>
              <div>
                <Badge variant="secondary">{activityLog.method}</Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Endpoint</label>
              <p className="font-mono text-sm">{activityLog.endpoint}</p>
            </div>
            {activityLog.executionTime !== undefined && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Execution Time</label>
                <p className="text-sm">{activityLog.executionTime}ms</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-muted-foreground">Created At</label>
              <p>{formatDate(activityLog.createdAt)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activityLog.userEmail && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <p>{activityLog.userEmail}</p>
              </div>
            )}
            {activityLog.userId && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">User ID</label>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-sm break-all">{activityLog.userId}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => navigate(`/users/${activityLog.userId}`)}
                    title="View user details"
                  >
                    <HiOutlineEye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            {activityLog.ipAddress && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">IP Address</label>
                <p className="font-mono text-sm">{activityLog.ipAddress}</p>
              </div>
            )}
            {activityLog.userAgent && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">User Agent</label>
                <p className="text-sm break-all">{activityLog.userAgent}</p>
              </div>
            )}
            {activityLog.errorMessage && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Error Message</label>
                <p className="text-sm text-red-600 break-all">{activityLog.errorMessage}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* GraphQL Information Card */}
        {isGraphQLLog && (
          <Card>
            <CardHeader>
              <CardTitle>GraphQL Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {activityLog.operationName && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Operation Name</label>
                  <div>
                    <Badge variant="outline" className="font-mono">
                      {activityLog.operationName}
                    </Badge>
                  </div>
                </div>
              )}
              {activityLog.operationType && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Operation Type</label>
                  <div>{getOperationTypeBadge(activityLog.operationType)}</div>
                </div>
              )}
              {activityLog.resolverPath && activityLog.resolverPath.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Resolver Path</label>
                  <p className="text-sm font-mono">{formatResolverPath(activityLog.resolverPath)}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Request & Response / GraphQL Query & Variables */}
      {(activityLog.requestBody || activityLog.responseBody || activityLog.query || activityLog.variables) && (
        <Card>
          <CardHeader>
            <CardTitle>{isGraphQLLog ? 'GraphQL Query & Variables' : 'Request & Response'}</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={isGraphQLLog ? (activityLog.query ? 'query' : 'variables') : 'request'} className="w-full">
              <TabsList>
                {activityLog.query && (
                  <TabsTrigger value="query">GraphQL Query</TabsTrigger>
                )}
                {activityLog.variables && (
                  <TabsTrigger value="variables">Variables</TabsTrigger>
                )}
                {activityLog.requestBody && (
                  <TabsTrigger value="request">Request Body</TabsTrigger>
                )}
                {activityLog.responseBody && (
                  <TabsTrigger value="response">Response Body</TabsTrigger>
                )}
              </TabsList>
              {activityLog.query && (
                <TabsContent value="query" className="mt-4">
                  <div className="bg-muted rounded-lg p-4 overflow-auto max-h-96">
                    <pre className="text-sm font-mono whitespace-pre-wrap">
                      {activityLog.query}
                    </pre>
                  </div>
                </TabsContent>
              )}
              {activityLog.variables && (
                <TabsContent value="variables" className="mt-4">
                  <div className="bg-muted rounded-lg p-4 overflow-auto max-h-96">
                    <pre className="text-sm font-mono whitespace-pre-wrap">
                      {JSON.stringify(activityLog.variables, null, 2)}
                    </pre>
                  </div>
                </TabsContent>
              )}
              {activityLog.requestBody && (
                <TabsContent value="request" className="mt-4">
                  <div className="bg-muted rounded-lg p-4 overflow-auto max-h-96">
                    <pre className="text-sm font-mono whitespace-pre-wrap">
                      {JSON.stringify(activityLog.requestBody, null, 2)}
                    </pre>
                  </div>
                </TabsContent>
              )}
              {activityLog.responseBody && (
                <TabsContent value="response" className="mt-4">
                  <div className="bg-muted rounded-lg p-4 overflow-auto max-h-96">
                    <pre className="text-sm font-mono whitespace-pre-wrap">
                      {JSON.stringify(activityLog.responseBody, null, 2)}
                    </pre>
                  </div>
                </TabsContent>
              )}
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

