import { useState, useEffect, useCallback, useRef } from 'react'

interface UseOTPResendOptions {
  cooldownSeconds?: number
  onResend?: () => void | Promise<void>
}

export function useOTPResend({ cooldownSeconds = 60, onResend }: UseOTPResendOptions = {}) {
  const [countdown, setCountdown] = useState(0)
  const [isResending, setIsResending] = useState(false)
  const [resendAttempts, setResendAttempts] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (countdown > 0) {
      intervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current)
              intervalRef.current = null
            }
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [countdown])

  const resendOTP = useCallback(async () => {
    if (countdown > 0 || isResending) {
      return
    }

    try {
      setIsResending(true)
      if (onResend) {
        await onResend()
      }
      setCountdown(cooldownSeconds)
      setResendAttempts((prev) => prev + 1)
    } catch (error) {
      // Error handling is done by the caller
      throw error
    } finally {
      setIsResending(false)
    }
  }, [countdown, isResending, cooldownSeconds, onResend])

  const resetCountdown = useCallback(() => {
    setCountdown(0)
    setResendAttempts(0)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  return {
    countdown,
    isResending,
    resendAttempts,
    canResend: countdown === 0 && !isResending,
    resendOTP,
    resetCountdown,
  }
}
