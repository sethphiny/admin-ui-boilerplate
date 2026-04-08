import { apiClient } from '../../client'
import {
  LoginDto,
  LoginResponse,
  VerifyLoginOTPDto,
  VerifyLoginOTPResponse,
  VerifyLoginOTPPasswordChangeResponse,
  SetInitialPasswordDto,
  ForceChangePasswordDto,
  ForceChangePasswordResponse,
  CreateSuperUserDto,
} from '@/types/auth/auth'
export const authApi = {
  /**
   * Step 1: Initiate login - sends OTP to email
   */
  login: async (data: LoginDto): Promise<LoginResponse> => {
    return apiClient.post<LoginResponse>('/admin/auth/login', data)
  },

  /**
   * Step 2: Verify OTP and get access token
   */
  verifyLoginOTP: async (
    data: VerifyLoginOTPDto
  ): Promise<VerifyLoginOTPResponse | VerifyLoginOTPPasswordChangeResponse> => {
    return apiClient.post<VerifyLoginOTPResponse | VerifyLoginOTPPasswordChangeResponse>(
      '/admin/auth/verify-login-otp',
      data
    )
  },

  /**
   * Set initial password (requires password_change_token)
   */
  setInitialPassword: async (data: SetInitialPasswordDto, token: string): Promise<void> => {
    return apiClient.post('/admin/auth/set-initial-password', data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  },

  /**
   * Force change password and complete login (requires password_change_token)
   */
  forceChangePassword: async (
    data: ForceChangePasswordDto,
    token: string
  ): Promise<ForceChangePasswordResponse> => {
    return apiClient.post<ForceChangePasswordResponse>(
      '/admin/auth/force-change-password',
      data,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )
  },

  /**
   * Create superuser (SUPER_ADMIN only)
   */
  createSuperuser: async (data: CreateSuperUserDto): Promise<void> => {
    return apiClient.post('/admin/auth/superuser/create', data)
  },
}

