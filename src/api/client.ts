import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosRequestConfig } from 'axios'
import { ApiResponse, ApiError } from '@/types/api/api'

// Custom error class that preserves HTTP status code
export class ApiErrorWithStatus extends Error {
  statusCode: number
  originalError: AxiosError<ApiError>

  constructor(message: string, statusCode: number, originalError: AxiosError<ApiError>) {
    super(message)
    this.name = 'ApiErrorWithStatus'
    this.statusCode = statusCode
    this.originalError = originalError
    Object.setPrototypeOf(this, ApiErrorWithStatus.prototype)
  }
}

// API base URL - defaults to localhost:3000 with /v1/api prefix
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/v1/api'

class ApiClient {
  private client: AxiosInstance
  private token: string | null = null
  private logoutInProgress: boolean = false
  private logoutQueue: Set<string> = new Set()
  private logoutTimeout: ReturnType<typeof setTimeout> | null = null
  private logoutCallback?: () => void

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Load token from localStorage
    this.loadTokenFromStorage()

    // Request interceptor
    this.client.interceptors.request.use(
      async (config) => {
        // Always load token from localStorage to ensure we have the latest token
        // This prevents "missing token" errors when token is updated elsewhere
        this.loadTokenFromStorage()
        
        // If token exists, add it to the request headers
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`
        } else {
          // If no token found, try to get it directly from localStorage as fallback
          try {
            const directToken = localStorage.getItem('auth_token')
            if (directToken) {
              this.token = directToken
              config.headers.Authorization = `Bearer ${directToken}`
            }
          } catch (error) {
            // Silently handle errors
          }
        }

        // TODO: Add any custom headers here (e.g., x-environment, x-tenant-id, etc.)
        // Example:
        // config.headers['x-custom-header'] = 'value'

        // Ensure numeric query params are properly formatted
        if (config.params) {
          const numericParams = ['limit', 'offset', 'page']
          numericParams.forEach((param) => {
            if (config.params[param] !== undefined && config.params[param] !== null) {
              const value = config.params[param]
              const numValue = Number(value)
              if (!isNaN(numValue)) {
                config.params[param] = numValue
              }
            }
          })
        }

        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        return response
      },
      async (error: AxiosError<ApiError>) => {
        const status = error.response?.status
        
        if (status === 401) {
          const currentPath = window.location.pathname
          const isAuthPage = currentPath.includes('/login')
          
          // Don't clear token if we just logged in (within last 5 seconds)
          const loginTime = sessionStorage.getItem('last_login_time')
          const timeSinceLogin = loginTime ? Date.now() - parseInt(loginTime) : Infinity
          const justLoggedIn = timeSinceLogin < 5000
          
          if (!isAuthPage && !justLoggedIn) {
            // Add endpoint to queue for debouncing
            const endpoint = error.config?.url || 'unknown'
            this.logoutQueue.add(endpoint)
            
            // Debounce logout operation
            if (this.logoutTimeout) {
              clearTimeout(this.logoutTimeout)
            }
            
            this.logoutTimeout = setTimeout(() => {
              this.handleLogout(endpoint)
            }, 100)
          }
        }
        // Note: 403 errors are handled but don't trigger logout
        // They will be caught by components/error handlers
        
        return Promise.reject(error)
      }
    )
  }

  loadTokenFromStorage() {
    try {
      // First try to get token from direct localStorage key
      const directToken = localStorage.getItem('auth_token')
      if (directToken) {
        this.token = directToken
        return
      }
      
      // Fallback: try to get token from Zustand storage
      const zustandStorage = localStorage.getItem('auth-storage')
      if (zustandStorage) {
        try {
          const parsed = JSON.parse(zustandStorage)
          const token = parsed?.state?.token
          if (token) {
            this.token = token
            // Also update direct storage for faster access
            localStorage.setItem('auth_token', token)
          }
        } catch (e) {
          // Silently handle parsing errors
        }
      }
    } catch (error) {
      // Silently handle errors
    }
  }

  setToken(token: string) {
    this.token = token
    localStorage.setItem('auth_token', token)
  }

  clearToken() {
    this.token = null
    localStorage.removeItem('auth_token')
  }

  setLogoutCallback(callback: () => void) {
    this.logoutCallback = callback
  }

  private async handleLogout(_endpoint: string) {
    // Prevent concurrent logout operations
    if (this.logoutInProgress) {
      return
    }

    this.logoutInProgress = true
    this.logoutQueue.clear()

    try {
      this.clearToken()
      
      // Call logout callback if set (avoids circular dependency)
      if (this.logoutCallback) {
        this.logoutCallback()
      }
      
      // Only redirect if we're not already on the login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }
    } catch (error) {
      // Silently handle logout errors
    } finally {
      // Reset flag after a delay to allow redirect to complete
      setTimeout(() => {
        this.logoutInProgress = false
      }, 1000)
    }
  }

  getToken(): string | null {
    return this.token
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    endpoint: string,
    data?: any,
    config?: InternalAxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.request<ApiResponse<T>>({
        method,
        url: endpoint,
        data,
        ...config,
      })
      return response.data
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>
      const status = axiosError.response?.status
      const errorData = axiosError.response?.data
      
      if (errorData) {
        // Extract message from error response (handles both formats)
        const errorMessage = errorData.message || 'An error occurred'
        
        // If we have a status code (403, 404, etc.), create a custom error that preserves it
        if (status) {
          throw new ApiErrorWithStatus(errorMessage, status, axiosError)
        }
        
        // Fallback to regular Error for backward compatibility
        throw new Error(errorMessage)
      }
      
      // Network or other errors
      throw new Error(axiosError.message || 'Network error occurred')
    }
  }

  async get<T>(endpoint: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('GET', endpoint, undefined, config as InternalAxiosRequestConfig)
  }

  async post<T>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('POST', endpoint, data, config as InternalAxiosRequestConfig)
  }

  async put<T>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', endpoint, data, config as InternalAxiosRequestConfig)
  }

  async patch<T>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', endpoint, data, config as InternalAxiosRequestConfig)
  }

  async delete<T>(endpoint: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', endpoint, undefined, config as InternalAxiosRequestConfig)
  }
}

export const apiClient = new ApiClient()

