import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { HiOutlineLockClosed, HiOutlineArrowLeft } from 'react-icons/hi2'
import { cn } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'

/**
 * PermissionError Component
 * 
 * Displays a user-friendly permission error (403) message.
 * 
 * @example
 * // In React Query error handling:
 * const { data, error } = useQuery(...)
 * if (error && isPermissionError(error)) {
 *   return <PermissionError message={handleApiError(error)} />
 * }
 * 
 * @example
 * // Inline variant (default):
 * <PermissionError message="You cannot access this resource" />
 * 
 * @example
 * // Full page variant:
 * <PermissionError variant="full" message="Access denied" />
 */
interface PermissionErrorProps {
  message?: string
  title?: string
  description?: string
  onGoBack?: () => void
  variant?: 'inline' | 'full'
  className?: string
  showBackButton?: boolean
}

export function PermissionError({
  message = 'You do not have permission to perform this action.',
  title = 'Access Denied',
  description,
  onGoBack,
  variant = 'inline',
  className,
  showBackButton = true,
}: PermissionErrorProps) {
  const navigate = useNavigate()

  const handleGoBack = () => {
    if (onGoBack) {
      onGoBack()
    } else {
      navigate(-1)
    }
  }

  const defaultDescription =
    'You do not have the necessary permissions to access this resource or perform this action. Please contact your administrator if you believe this is an error.'

  const content = (
    <>
      <div className="rounded-full bg-gradient-to-br from-destructive/10 to-destructive/5 p-5 mb-6 shadow-sm animate-in zoom-in duration-500">
        <HiOutlineLockClosed className="h-10 w-10 text-destructive" />
      </div>
      <div className="space-y-3 mb-6">
        <h3 className="text-xl font-bold tracking-tight">{title}</h3>
        {message && (
          <p className="text-sm text-muted-foreground max-w-md mx-auto font-medium">
            {message}
          </p>
        )}
        {(description || defaultDescription) && (
          <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            {description || defaultDescription}
          </p>
        )}
      </div>
      {showBackButton && (
        <div className="flex gap-2 flex-wrap justify-center">
          <Button 
            onClick={handleGoBack} 
            variant="outline" 
            size="sm"
            className="transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <HiOutlineArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      )}
    </>
  )

  if (variant === 'full') {
    return (
      <div className={cn('flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-background via-muted/20 to-background', className)}>
        <Card className="w-full max-w-md shadow-xl border-2 border-destructive/20 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardHeader className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-gradient-to-br from-destructive/10 to-destructive/5 p-3">
                <HiOutlineLockClosed className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle className="text-2xl font-bold">{title}</CardTitle>
            </div>
            <CardDescription className="text-base">
              {message || 'You do not have permission to perform this action.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(description || defaultDescription) && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {description || defaultDescription}
              </p>
            )}
            {showBackButton && (
              <div className="flex gap-2 pt-2">
                <Button 
                  onClick={handleGoBack} 
                  variant="default"
                  className="w-full transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  <HiOutlineArrowLeft className="h-4 w-4 mr-2" />
                  Go Back
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Inline variant
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-16 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500',
        className
      )}
    >
      {content}
    </div>
  )
}

