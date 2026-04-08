import { toast } from '@/hooks/ui/use-toast'
import { AxiosError } from 'axios'
import { ApiError } from '@/types/api/api'
import { ApiErrorWithStatus } from '@/api/client'

export function handleApiError(error: unknown): string {
  let message = 'An unexpected error occurred'
  let statusCode: number | undefined

  // Check if it's our custom ApiErrorWithStatus (from API client)
  if (error instanceof ApiErrorWithStatus) {
    message = error.message
    statusCode = error.statusCode
  }
  // Check if it's an AxiosError with response data
  else if (error instanceof AxiosError) {
    const errorData = error.response?.data as ApiError | undefined
    statusCode = error.response?.status
    
    if (errorData) {
      // Extract message from API response (handles both formats)
      message = errorData.message || error.message || 'An error occurred'
    } else {
      message = error.message || 'Network error occurred'
    }
  }
  // Check if error object has statusCode property (direct API response)
  else if (error && typeof error === 'object' && 'statusCode' in error && 'message' in error) {
    const apiError = error as ApiError
    message = apiError.message || 'An error occurred'
    statusCode = apiError.statusCode
  }
  // Regular Error instance
  else if (error instanceof Error) {
    message = error.message
  }
  // String error
  else if (typeof error === 'string') {
    message = error
  }

  // Humanize common error messages based on status code or message content
  if (statusCode === 403 || message.toLowerCase().includes('permission') || message.toLowerCase().includes('access denied')) {
    return 'You do not have permission to perform this action.'
  }

  const humanizedMessages: Record<string, string> = {
    'Network Error': 'Unable to connect to the server. Please check your internet connection.',
    'Request failed with status code 401': 'Your session has expired. Please log in again.',
    'Request failed with status code 403': 'You do not have permission to perform this action.',
    'Request failed with status code 404': 'The requested resource was not found.',
    'Use /admin/thresh0ld-withdrawals/whitelist endpoints for whitelist operations': 'Whitelist endpoints are not available. Please ensure the backend API is properly configured.',
    'Request failed with status code 429': 'Too many requests. Please wait a moment and try again.',
    'Request failed with status code 500': 'A server error occurred. Please try again later.',
  }

  return humanizedMessages[message] || message
}

/**
 * Check if an error is a permission error (403)
 */
export function isPermissionError(error: unknown): boolean {
  if (error instanceof ApiErrorWithStatus) {
    return error.statusCode === 403
  }
  
  if (error instanceof AxiosError) {
    return error.response?.status === 403
  }
  
  if (error && typeof error === 'object' && 'statusCode' in error) {
    return (error as ApiError).statusCode === 403
  }
  
  return false
}

export function showErrorToast(error: unknown) {
  const message = handleApiError(error)
  toast({
    title: 'Error',
    description: message,
    variant: 'destructive',
  })
}

export function showSuccessToast(message: string) {
  toast({
    title: 'Success',
    description: message,
  })
}

