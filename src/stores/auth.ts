import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { User } from '@/types/auth/auth'
import { apiClient } from '@/api/client'

interface AuthState {
  user: User | null
  token: string | null
  setUser: (user: User | null) => void
  setToken: (token: string) => void
  setAuth: (user: User, token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => {
      const store: AuthState = {
        user: null,
        token: null,
        setUser: (user: User | null) => set({ user }),
        setToken: (token: string) => {
          apiClient.setToken(token)
          set({ token })
        },
        setAuth: (user: User, token: string) => {
          apiClient.setToken(token)
          set({ user, token })
        },
        logout: () => {
          apiClient.clearToken()
          set({ user: null, token: null })
        },
      }

      // Set logout callback on apiClient to avoid circular dependency
      // This allows apiClient to call logout when receiving 401 errors
      apiClient.setLogoutCallback(() => {
        store.logout()
      })

      return store
    },
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => {
        // This runs BEFORE rehydration - check localStorage for token
        const token = localStorage.getItem('auth_token')
        if (token) {
          apiClient.setToken(token)
        }
        
        // This runs AFTER rehydration completes
        return (state, error) => {
          if (error) {
            // Try to recover from token storage
            try {
              const token = localStorage.getItem('auth_token')
              if (token) {
                apiClient.setToken(token)
              }
            } catch (e) {
              // Silently handle errors
            }
            return
          }
          
          // Always check token storage as fallback
          let storedToken: string | null = null
          try {
            storedToken = localStorage.getItem('auth_token')
          } catch {
            // Silently handle errors
          }
          
          // Priority: Zustand state > stored token
          if (state?.token) {
            try {
              apiClient.setToken(state.token)
            } catch (error) {
              // Fallback to stored token
              if (storedToken) {
                apiClient.setToken(storedToken)
              }
            }
          } else if (storedToken) {
            try {
              apiClient.setToken(storedToken)
            } catch {
              // Silently handle errors
            }
          } else {
            // Ensure token is cleared
            apiClient.clearToken()
          }
        }
      },
    }
  )
)

// Selector to get isAuthenticated based on both user and token
export const useIsAuthenticated = () => {
  const { user, token } = useAuthStore()
  return !!(user && token)
}

