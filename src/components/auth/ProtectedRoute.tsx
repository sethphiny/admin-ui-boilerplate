import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuthStore } from '@/stores/auth'
import { useEffect, useState } from 'react'
import Preloader from '@/components/misc/Preloader'
import { useInactivityTimeout } from '@/hooks/auth/useInactivityTimeout'

interface ProtectedRouteProps {
  children: ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, token, logout } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [hasCheckedRehydration, setHasCheckedRehydration] = useState(false)

  // 20 minutes inactivity timeout (1,200,000 milliseconds)
  useInactivityTimeout({
    timeout: 20 * 60 * 1000, // 20 minutes
    onTimeout: () => {
      logout()
      // Redirect will happen automatically via the isAuthenticated check below
    },
    enabled: isAuthenticated, // Only enable when authenticated
  })

  useEffect(() => {
    const checkAuth = () => {
      // Check localStorage directly first for immediate feedback
      let hasStoredAuth = false
      let storedUser = null
      let storedToken = null
      try {
        const stored = localStorage.getItem('auth-storage')
        if (stored) {
          const parsed = JSON.parse(stored)
          storedUser = parsed?.state?.user
          storedToken = parsed?.state?.token
          hasStoredAuth = !!(storedUser && storedToken)
        }
      } catch (error) {
        // Silently handle errors
      }

      // Also check direct token storage
      const directToken = localStorage.getItem('auth_token')
      const hasDirectToken = !!directToken

      // Check current Zustand state
      const hasCurrentAuth = !!(user && token)

      // Authentication is valid if we have either Zustand state or stored state
      // Also check direct token as fallback
      const finalAuth = hasCurrentAuth || (hasStoredAuth && hasDirectToken)

      setIsAuthenticated(finalAuth)
      setIsLoading(false)
      setHasCheckedRehydration(true)
    }

    // Check immediately
    checkAuth()

    // Also check after a delay to catch Zustand rehydration
    const timer = setTimeout(() => {
      checkAuth()
    }, 300)

    return () => clearTimeout(timer)
  }, [user, token])

  // Show loading state while checking authentication or waiting for rehydration
  if (isLoading || !hasCheckedRehydration) {
    return <Preloader fullScreen />
  }

  // Only redirect if we're sure authentication failed
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

