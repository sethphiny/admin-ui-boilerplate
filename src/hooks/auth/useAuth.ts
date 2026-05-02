import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import { authApi } from '@/api/endpoints/auth/auth'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'
import {
  LoginDto,
  VerifyLoginOTPDto,
  ForceChangePasswordDto,
  VerifyLoginOTPPasswordChangeResponse,
} from '@/types/auth/auth'

export function useAuth() {
  const navigate = useNavigate()
  const { logout: storeLogout } = useAuthStore()
  const [loading, setLoading] = useState(false)

  /**
   * Finalize login - set store, persistence and navigate
   */
  const completeLogin = async (account: any, accessToken: string, successMessage = 'Login successful') => {
    // Mark login time to prevent premature token clearing
    sessionStorage.setItem('last_login_time', Date.now().toString())

    try {
      const { setAuth } = useAuthStore.getState()
      setAuth(account, accessToken)

      // Wait for Zustand persistence to complete
      await new Promise<void>((resolve) => {
        const maxAttempts = 30
        let attempts = 0

        const checkPersistence = () => {
          attempts++
          const zustandStorage = localStorage.getItem('auth-storage')
          const directToken = localStorage.getItem('auth_token')

          // Verify both are present
          if (zustandStorage && directToken) {
            try {
              const parsed = JSON.parse(zustandStorage)
              if (parsed?.state?.token && parsed?.state?.user) {
                resolve()
                return
              }
            } catch (e) {
              // Silently handle parsing errors
            }
          }

          if (attempts >= maxAttempts) {
            // Ensure direct token is at least set
            if (!localStorage.getItem('auth_token')) {
              localStorage.setItem('auth_token', accessToken)
            }
            resolve()
            return
          }

          setTimeout(checkPersistence, 50)
        }

        // Ensure direct token is set immediately
        localStorage.setItem('auth_token', accessToken)

        // Start checking after a brief delay
        setTimeout(checkPersistence, 100)
      })

      showSuccessToast(successMessage)

      // Navigate to dashboard
      navigate('/dashboard', { replace: true })
    } catch (error) {
      // Clear partial state on error
      sessionStorage.removeItem('last_login_time')
      localStorage.removeItem('auth_token')
      throw error
    }
  }

  /**
   * Step 1: Initiate login - sends OTP to email
   */
  const login = async (data: LoginDto) => {
    setLoading(true)
    try {
      const response = await authApi.login(data)
      
      // Bypass: If backend returns token immediately, complete login
      if (response && response.access_token) {
        await completeLogin(response.account, response.access_token, response.message)
        return response
      }

      return response
    } catch (error) {
      showErrorToast(error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  /**
   * Step 2: Verify OTP and complete login
   */
  const verifyOTP = async (data: VerifyLoginOTPDto) => {
    setLoading(true)
    try {
      const response = await authApi.verifyLoginOTP(data)

      // Check if password change is required
      if (response.requiresPasswordChange) {
        return {
          requiresPasswordChange: true,
          passwordChangeToken: (response as VerifyLoginOTPPasswordChangeResponse).password_change_token,
          account: response.account,
        }
      }

      // Normal login flow - we have access_token
      if ('access_token' in response) {
        await completeLogin(response.account, response.access_token)
      } else {
        throw new Error('Invalid response: missing access_token')
      }
    } catch (error) {
      showErrorToast(error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  /**
   * Force change password and complete login
   */
  const forceChangePassword = async (data: ForceChangePasswordDto, passwordChangeToken: string) => {
    setLoading(true)
    try {
      const response = await authApi.forceChangePassword(data, passwordChangeToken)

      if (response.access_token) {
        const accessToken = response.access_token
        const account = response.account

        // Mark login time
        sessionStorage.setItem('last_login_time', Date.now().toString())

        const { setAuth } = useAuthStore.getState()
        setAuth(account, accessToken)

        // Wait for persistence
        await new Promise<void>((resolve) => {
          const maxAttempts = 30
          let attempts = 0

          const checkPersistence = () => {
            attempts++
            const zustandStorage = localStorage.getItem('auth-storage')
            const directToken = localStorage.getItem('auth_token')

            if (zustandStorage && directToken) {
              try {
                const parsed = JSON.parse(zustandStorage)
                if (parsed?.state?.token && parsed?.state?.user) {
                  resolve()
                  return
                }
              } catch (e) {
                // Silently handle parsing errors
              }
            }

            if (attempts >= maxAttempts) {
              if (!localStorage.getItem('auth_token')) {
                localStorage.setItem('auth_token', accessToken)
              }
              resolve()
              return
            }

            setTimeout(checkPersistence, 50)
          }

          localStorage.setItem('auth_token', accessToken)
          setTimeout(checkPersistence, 100)
        })

        showSuccessToast('Password changed successfully. Login successful')
        navigate('/dashboard', { replace: true })
      } else {
        throw new Error('Invalid response: missing access_token')
      }
    } catch (error) {
      showErrorToast(error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    storeLogout()
    navigate('/login')
  }

  const { user, token } = useAuthStore()
  const isAuthenticated = !!(user && token)

  return {
    user,
    isAuthenticated,
    loading,
    login,
    verifyOTP,
    forceChangePassword,
    logout,
  }
}

