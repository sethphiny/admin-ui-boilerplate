import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Label } from '@/components/ui/label'
import { Combobox, ComboboxOption } from '@/components/ui/combobox'
import { usersApi } from '@/api/endpoints/users/users'
import { User } from '@/types/user/users'
import { useDebounce } from '@/hooks/useDebounce'
import { HiOutlineXMark, HiOutlineEnvelope, HiOutlineExclamationTriangle, HiOutlinePlus } from 'react-icons/hi2'
import { showErrorToast } from '@/lib/errorHandler'
import { cn } from '@/lib/utils'

interface MaintenanceExceptionEmailsProps {
  emails: string[]
  onUpdate: (emails: string[]) => Promise<void>
  isUpdating?: boolean
  maintenanceEnabled?: boolean
}

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function MaintenanceExceptionEmails({
  emails,
  onUpdate,
  isUpdating = false,
  maintenanceEnabled = false,
}: MaintenanceExceptionEmailsProps) {
  const [newEmail, setNewEmail] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)

  // Debounce search query for API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  // Fetch users for selection with debounced search
  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users', 'exception-email-search', debouncedSearchQuery],
    queryFn: async () => {
      return usersApi.listUsers({
        page: 1,
        limit: 50,
        search: debouncedSearchQuery.trim() || undefined,
      })
    },
    enabled: debouncedSearchQuery.trim().length >= 2, // Only search if 2+ characters
    staleTime: 30000, // Cache for 30 seconds
  })

  // Convert users to combobox options
  const userOptions: ComboboxOption[] =
    usersData?.data?.map((user: User) => ({
      value: user.email.toLowerCase(),
      label: user.email,
      description: `${user.firstname || ''} ${user.lastname || ''}`.trim() || 'No name',
    })) || []

  // Add manual entry option if search query looks like an email but not in results
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const isEmailFormat = emailRegex.test(searchQuery.trim())
  const isInResults = userOptions.some(opt => opt.value.toLowerCase() === searchQuery.trim().toLowerCase())
  const showManualEntry = isEmailFormat && !isInResults && searchQuery.trim().length > 0

  // Combine user options with manual entry option if applicable
  const allOptions: ComboboxOption[] = showManualEntry
    ? [
        ...userOptions,
        {
          value: searchQuery.trim().toLowerCase(),
          label: `Add "${searchQuery.trim()}"`,
          description: 'Manual entry (not in system)',
        },
      ]
    : userOptions

  const validateEmail = (email: string): string | null => {
    const trimmed = email.trim().toLowerCase()
    
    if (!trimmed) {
      return 'Email is required'
    }
    
    if (!EMAIL_REGEX.test(trimmed)) {
      return 'Invalid email format'
    }
    
    // Check for duplicates (case-insensitive)
    if (emails.some(existing => existing.toLowerCase() === trimmed)) {
      return 'This email is already in the exception list'
    }
    
    return null
  }

  const handleAddEmail = async (emailToAdd?: string) => {
    const trimmed = emailToAdd || newEmail.trim()
    
    // Validate email
    const error = validateEmail(trimmed)
    if (error) {
      setValidationError(error)
      return
    }

    setValidationError(null)
    setIsAdding(true)

    try {
      const normalizedEmail = trimmed.toLowerCase()
      const updatedEmails = [...emails, normalizedEmail]
      await onUpdate(updatedEmails)
      setNewEmail('')
      setSearchQuery('')
      // Success toast is shown by the parent component (useSystemConfig hook)
    } catch (error) {
      showErrorToast(error)
    } finally {
      setIsAdding(false)
    }
  }

  const handleComboboxValueChange = (value: string) => {
    if (value) {
      // Email selected from dropdown - add it immediately
      handleAddEmail(value)
    }
  }

  const handleComboboxSearchChange = (query: string) => {
    setSearchQuery(query)
    setNewEmail(query) // Keep in sync for manual entry fallback
    setValidationError(null)
  }

  const handleRemoveEmail = async (emailToRemove: string) => {
    try {
      const updatedEmails = emails.filter(email => email !== emailToRemove)
      await onUpdate(updatedEmails)
      // Success toast is shown by the parent component (useSystemConfig hook)
    } catch (error) {
      showErrorToast(error)
    }
  }

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <HiOutlineEnvelope className="h-5 w-5 text-muted-foreground" />
              Email Exceptions
            </CardTitle>
            <CardDescription className="mt-1">
              Email addresses that can bypass maintenance mode restrictions
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-sm">
            {emails.length} {emails.length === 1 ? 'email' : 'emails'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Warning when maintenance enabled but no exceptions */}
        {maintenanceEnabled && emails.length === 0 && (
          <Alert variant="default" className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
            <HiOutlineExclamationTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertTitle className="text-amber-800 dark:text-amber-200">No Exception Emails Configured</AlertTitle>
            <AlertDescription className="text-amber-700 dark:text-amber-300">
              Maintenance mode is enabled but no exception emails are configured. Only admins will be able to access the system.
            </AlertDescription>
          </Alert>
        )}

        {/* Email List */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Exception Emails ({emails.length})</Label>
          {emails.length === 0 ? (
            <div className="p-4 border border-dashed rounded-lg text-center text-sm text-muted-foreground">
              <p>No exception emails configured.</p>
              <p className="text-xs mt-1">All users will be blocked during maintenance (except admins).</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-3 bg-muted/30">
              {emails.map((email) => (
                <div
                  key={email}
                  className="flex items-center justify-between p-2 rounded-md bg-background border border-border/50 hover:bg-accent/50 transition-colors"
                >
                  <span className="text-sm font-mono text-foreground flex items-center gap-2">
                    <HiOutlineEnvelope className="h-4 w-4 text-muted-foreground" />
                    {email}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveEmail(email)}
                    disabled={isUpdating || isAdding}
                    className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    title="Remove email"
                  >
                    <HiOutlineXMark className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Email Input */}
        <div className="space-y-2">
          <Label htmlFor="exception-email-input" className="text-sm font-medium">
            Add Exception Email
          </Label>
          <div className="flex gap-2">
            <div className="flex-1 space-y-1">
              <Combobox
                options={allOptions}
                value=""
                onValueChange={handleComboboxValueChange}
                onSearchChange={handleComboboxSearchChange}
                placeholder="Search users by email or enter manually..."
                searchPlaceholder="Search by email or name..."
                emptyText={isLoadingUsers ? "Searching users..." : "No users found. Type an email to add manually."}
                disabled={isUpdating || isAdding}
                className={cn(
                  validationError && 'border-destructive focus-visible:ring-destructive'
                )}
              />
              {validationError && (
                <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                  <HiOutlineExclamationTriangle className="h-3 w-3" />
                  {validationError}
                </p>
              )}
            </div>
            <Button
              type="button"
              onClick={() => handleAddEmail()}
              disabled={isUpdating || isAdding || !newEmail.trim()}
              className="shrink-0"
            >
              {isAdding ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Adding...
                </span>
              ) : (
                <>
                  <HiOutlinePlus className="h-4 w-4 mr-2" />
                  Add
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Search for users by email or name, or type any email address to add manually. Case-insensitive.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
