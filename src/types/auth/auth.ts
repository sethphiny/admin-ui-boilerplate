// Admin User type matching API response
export interface User {
  id: string
  email: string
  name: string
  role: string
  isActive?: boolean
  createdAt?: string
  lastLoginAt?: string
}

// Login DTO
export interface LoginDto {
  email: string
  password: string
}

// Login Response (Supports both OTP and OTP Bypass flows)
export interface LoginResponse {
  requiresPasswordChange?: boolean
  access_token?: string
  account?: User
  message?: string
}

// Verify OTP DTO
export interface VerifyLoginOTPDto {
  email: string
  otp: string
}

// Verify OTP Response (Normal)
// API returns data directly
export interface VerifyLoginOTPResponse {
  account: User
  access_token: string
  requiresPasswordChange: false
}

// Verify OTP Response (Password Change Required)
// API returns data directly
export interface VerifyLoginOTPPasswordChangeResponse {
  requiresPasswordChange: true
  account: User
  password_change_token: string
}

// Set Initial Password DTO
export interface SetInitialPasswordDto {
  newPassword: string
}

// Force Change Password DTO
export interface ForceChangePasswordDto {
  newPassword: string
}

// Force Change Password Response
// API returns data directly
export interface ForceChangePasswordResponse {
  account: User
  access_token: string
}

// Create Superuser DTO
export interface CreateSuperUserDto {
  email: string
  password: string
  roleName: string
}

