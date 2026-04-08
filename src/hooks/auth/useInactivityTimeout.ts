import { useEffect, useRef, useCallback } from 'react'

interface UseInactivityTimeoutOptions {
  timeout: number // Timeout in milliseconds (20 minutes = 1,200,000ms)
  onTimeout: () => void // Callback when timeout expires
  enabled?: boolean // Whether the timeout is enabled
  throttle?: number // Throttle interval for activity events (default: 1000ms)
}

/**
 * Hook to track user inactivity and trigger a callback after a specified timeout
 * 
 * @param options Configuration options
 * @param options.timeout Timeout duration in milliseconds
 * @param options.onTimeout Callback function to execute when timeout expires
 * @param options.enabled Whether the timeout tracking is enabled (default: true)
 * @param options.throttle Throttle interval for activity events in milliseconds (default: 1000ms)
 */
export function useInactivityTimeout({
  timeout,
  onTimeout,
  enabled = true,
  throttle = 1000,
}: UseInactivityTimeoutOptions) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastActivityRef = useRef<number>(Date.now())
  const throttleRef = useRef<number>(0)
  const isPageVisibleRef = useRef<boolean>(!document.hidden)

  // Reset the timeout timer
  const resetTimeout = useCallback(() => {
    if (!enabled) return

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    // Update last activity timestamp
    lastActivityRef.current = Date.now()

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      onTimeout()
    }, timeout)
  }, [timeout, onTimeout, enabled])

  // Handle activity with throttling
  const handleActivity = useCallback(() => {
    if (!enabled) return

    const now = Date.now()
    
    // Throttle activity events to avoid excessive timer resets
    if (now - throttleRef.current < throttle) {
      return
    }

    throttleRef.current = now
    resetTimeout()
  }, [enabled, throttle, resetTimeout])

  // Handle page visibility changes
  const handleVisibilityChange = useCallback(() => {
    if (!enabled) return

    const isVisible = !document.hidden
    isPageVisibleRef.current = isVisible

    if (isVisible) {
      // Page became visible - check if timeout should have expired
      const timeSinceLastActivity = Date.now() - lastActivityRef.current
      
      if (timeSinceLastActivity >= timeout) {
        // Timeout has expired while page was hidden
        onTimeout()
      } else {
        // Reset timeout with remaining time
        const remainingTime = timeout - timeSinceLastActivity
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
        timeoutRef.current = setTimeout(() => {
          onTimeout()
        }, remainingTime)
      }
    } else {
      // Page became hidden - clear timeout (will resume when visible)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [enabled, timeout, onTimeout])

  useEffect(() => {
    if (!enabled) {
      // Clear timeout if disabled
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      return
    }

    // Set initial timeout
    resetTimeout()

    // Activity events to track
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'keydown',
      'scroll',
      'touchstart',
      'click',
    ]

    // Add event listeners with throttling
    events.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true })
    })

    // Listen for page visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Cleanup function
    return () => {
      // Remove event listeners
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity)
      })
      document.removeEventListener('visibilitychange', handleVisibilityChange)

      // Clear timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [enabled, handleActivity, handleVisibilityChange, resetTimeout])
}
