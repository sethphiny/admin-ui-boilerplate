import { useState, useEffect, useRef, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/hooks/auth/useAuth'
import { useOTPResend } from '@/hooks/auth/useOTPResend'
import { useDebouncedCallback } from '@/hooks/useDebounce'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/forms/PasswordInput'
import { OTPInput } from '@/components/forms/OTPInput'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldLabel, FieldError, FieldGroup } from '@/components/ui/field'
import { Controller } from 'react-hook-form'
import { StepIndicator } from '@/components/auth/StepIndicator'
import { User } from '@/types/auth/auth'
import { showSuccessToast } from '@/lib/errorHandler'
import { HiOutlineEnvelope, HiOutlineLockClosed, HiOutlineCheckCircle, HiOutlineExclamationCircle, HiArrowRight } from 'react-icons/hi2'
import { cn } from '@/lib/utils'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

const otpSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits'),
})

const passwordChangeSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Password must be at least 8 characters'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type LoginFormData = z.infer<typeof loginSchema>
type OTPFormData = z.infer<typeof otpSchema>
type PasswordChangeFormData = z.infer<typeof passwordChangeSchema>

type LoginStep = 'login' | 'otp' | 'password-change'

const REMEMBER_EMAIL_KEY = 'admin_login_remembered_email'

export default function LoginPage() {
  const { login, verifyOTP, forceChangePassword, loading } = useAuth()
  const { isOffline } = useNetworkStatus()
  const [step, setStep] = useState<LoginStep>('login')
  const [email, setEmail] = useState('')
  const [rememberEmail, setRememberEmail] = useState(false)
  const [passwordChangeToken, setPasswordChangeToken] = useState<string | null>(null)
  const [_account, setAccount] = useState<User | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [requiresPasswordChange, setRequiresPasswordChange] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [canRetry, setCanRetry] = useState(false)
  const otpInputRef = useRef<HTMLDivElement>(null)
  const loginFormRef = useRef<HTMLFormElement>(null)
  const passwordChangeFormRef = useRef<HTMLFormElement>(null)

  // Store password temporarily for OTP resend (cleared when moving to next step)
  const [tempPassword, setTempPassword] = useState<string>('')

  // Dynamic steps array - only show password step when required
  const steps = useMemo(() => {
    return requiresPasswordChange ? ['Login', 'Verify', 'Password'] : ['Login', 'Verify']
  }, [requiresPasswordChange])

  // Dynamic step configuration based on whether password change is required
  const stepConfig = useMemo(() => {
    const config: Record<LoginStep, { number: number; label: string }> = {
      login: { number: 1, label: 'Login' },
      otp: { number: 2, label: 'Verify' },
      'password-change': { number: 3, label: 'Password' },
    }
    return config
  }, [])

  const currentStepNumber = stepConfig[step].number

  // Auto-focus OTP input when OTP step appears
  useEffect(() => {
    if (step === 'otp' && otpInputRef.current) {
      const firstInput = otpInputRef.current.querySelector('input') as HTMLInputElement
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 100)
      }
    }
  }, [step])

  // Keyboard shortcuts - Enter key submits forms
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle Enter if not already in a form submission
      if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        const activeElement = document.activeElement
        
        // Check if we're in a form input and not already submitting
        if (
          activeElement &&
          (activeElement.tagName === 'INPUT' || activeElement.tagName === 'BUTTON') &&
          !loading &&
          !isTransitioning
        ) {
          // Let the form handle Enter naturally, but prevent double submission
          if (activeElement.tagName === 'INPUT') {
            const form = activeElement.closest('form')
            if (form && !form.querySelector('button[type="submit"]:disabled')) {
              // Form will handle Enter naturally
              return
            }
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [loading, isTransitioning])

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const otpForm = useForm<OTPFormData>({
    resolver: zodResolver(otpSchema),
  })

  const passwordChangeForm = useForm<PasswordChangeFormData>({
    resolver: zodResolver(passwordChangeSchema),
  })

  // Load remembered email on mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem(REMEMBER_EMAIL_KEY)
    if (rememberedEmail) {
      setEmail(rememberedEmail)
      setRememberEmail(true)
      loginForm.setValue('email', rememberedEmail)
    }
  }, [loginForm])

  // OTP resend hook - defined after forms to access them
  const { countdown, isResending, canResend, resendOTP, resetCountdown } = useOTPResend({
    cooldownSeconds: 60,
    onResend: async () => {
      if (!email) {
        throw new Error('Email is required to resend OTP')
      }
      
      // Try to get password from form first, fallback to temp storage
      const formData = loginForm.getValues()
      const passwordToUse = formData.password || tempPassword
      
      if (!passwordToUse) {
        throw new Error('Please go back and re-enter your credentials to resend OTP')
      }

      await login({ email, password: passwordToUse })
      showSuccessToast('OTP resent to your email. Please check your inbox.')
    },
  })

  // Debounced login submit
  const debouncedLoginSubmit = useDebouncedCallback(async (data: LoginFormData) => {
    try {
      setIsTransitioning(true)
      setApiError(null)
      setCanRetry(false)

      // Check network status
      if (isOffline) {
        setApiError('No internet connection. Please check your network and try again.')
        setCanRetry(true)
        setIsTransitioning(false)
        return
      }

      await login(data)
      setEmail(data.email)
      // Store password temporarily for OTP resend (only during OTP step)
      setTempPassword(data.password)

      // Handle remember email
      if (rememberEmail) {
        localStorage.setItem(REMEMBER_EMAIL_KEY, data.email)
      } else {
        localStorage.removeItem(REMEMBER_EMAIL_KEY)
      }

      // Reset password change requirement when starting a new login flow
      setRequiresPasswordChange(false)
      resetCountdown()
      
      // Always go to OTP step after login, regardless of requiresPasswordChange
      // The password change requirement will be checked after OTP verification
      setTimeout(() => {
        setStep('otp')
        otpForm.reset()
        setIsTransitioning(false)
        showSuccessToast('OTP sent to your email. Please check your inbox.')
        // Focus first OTP input
        if (otpInputRef.current) {
          const firstInput = otpInputRef.current.querySelector('input') as HTMLInputElement
          firstInput?.focus()
        }
      }, 300)
    } catch (error: any) {
      setIsTransitioning(false)
      setCanRetry(true)
      
      // Extract error message
      const errorMessage = error?.response?.data?.message || error?.message || 'An error occurred. Please try again.'
      setApiError(errorMessage)
      
      // Error toast is already handled by useAuth hook, but we show inline error too
    }
  }, 500)

  const onLoginSubmit = async (data: LoginFormData) => {
    setApiError(null)
    debouncedLoginSubmit(data)
  }

  const onOTPSubmit = async (data: OTPFormData) => {
    try {
      setIsTransitioning(true)
      setApiError(null)
      setCanRetry(false)

      // Check network status
      if (isOffline) {
        setApiError('No internet connection. Please check your network and try again.')
        setCanRetry(true)
        setIsTransitioning(false)
        return
      }

      const result = await verifyOTP({
        email,
        otp: data.otp,
      })

      // Clear temp password after successful OTP verification
      setTempPassword('')

      // Check if password change is required after OTP verification
      if (result && 'requiresPasswordChange' in result && result.requiresPasswordChange && result.passwordChangeToken) {
        setRequiresPasswordChange(true)
        setPasswordChangeToken(result.passwordChangeToken)
        setAccount(result.account)
        setTimeout(() => {
          setStep('password-change')
          passwordChangeForm.reset()
          setIsTransitioning(false)
          // Focus first password input
          if (passwordChangeFormRef.current) {
            const firstInput = passwordChangeFormRef.current.querySelector('input') as HTMLInputElement
            firstInput?.focus()
          }
        }, 300)
      } else {
        setIsTransitioning(false)
        // If no password change required, verifyOTP handles navigation to dashboard
      }
    } catch (error: any) {
      setIsTransitioning(false)
      setCanRetry(true)
      
      // Extract error message
      const errorMessage = error?.response?.data?.message || error?.message || 'Invalid OTP. Please try again.'
      setApiError(errorMessage)
      
      // Reset OTP form on error to allow retry
      otpForm.reset()
      // Error toast is already handled by useAuth hook
    }
  }

  const onPasswordChangeSubmit = async (data: PasswordChangeFormData) => {
    if (!passwordChangeToken) {
      setApiError('Password change token is missing. Please start the login process again.')
      return
    }

    try {
      setIsTransitioning(true)
      setApiError(null)
      setCanRetry(false)

      // Check network status
      if (isOffline) {
        setApiError('No internet connection. Please check your network and try again.')
        setCanRetry(true)
        setIsTransitioning(false)
        return
      }

      await forceChangePassword(
        { newPassword: data.newPassword },
        passwordChangeToken
      )
      // forceChangePassword handles navigation
    } catch (error: any) {
      setIsTransitioning(false)
      setCanRetry(true)
      
      // Extract error message
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to change password. Please try again.'
      setApiError(errorMessage)
      // Error toast is already handled by useAuth hook
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      {/* Skip to main content link for screen readers */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      >
        Skip to main content
      </a>

      {/* Network status indicator */}
      {isOffline && (
        <div
          role="alert"
          aria-live="assertive"
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-destructive text-destructive-foreground px-4 py-2 rounded-md shadow-lg flex items-center gap-2 animate-in slide-in-from-top-2 duration-300"
        >
          <HiOutlineExclamationCircle className="h-4 w-4 animate-pulse" aria-hidden="true" />
          <span className="text-sm font-medium">No internet connection</span>
        </div>
      )}

      {/* ARIA live region for dynamic updates */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {isTransitioning && step === 'login' && 'Sending OTP...'}
        {isTransitioning && step === 'otp' && 'Verifying OTP...'}
        {isTransitioning && step === 'password-change' && 'Changing password...'}
        {apiError && `Error: ${apiError}`}
      </div>

      <Card
        id="main-content"
        className="w-full max-w-md shadow-2xl border border-border/60 bg-card backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-500"
        aria-labelledby="login-title"
        aria-describedby="login-description"
      >
        <CardHeader className="space-y-5 pb-6 border-b border-border/60">
          <div className="space-y-2.5 text-center">
            <CardTitle
              id="login-title"
              className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent drop-shadow-sm"
            >
              Admin Login
            </CardTitle>
            <CardDescription id="login-description" className="text-base text-muted-foreground font-normal">
              {step === 'login' && 'Enter your credentials to continue'}
              {step === 'otp' && 'Enter the verification code sent to your email'}
              {step === 'password-change' && 'Set a new password to secure your account'}
            </CardDescription>
          </div>
          
          {/* Step Indicator */}
          <div className="pt-4" aria-label={`Step ${currentStepNumber} of ${steps.length}`}>
            <StepIndicator
              currentStep={currentStepNumber}
              steps={steps}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div
            className={cn(
              'transition-all duration-300',
              isTransitioning && 'opacity-50 pointer-events-none'
            )}
            aria-busy={isTransitioning}
          >
            {step === 'login' && (
                <form
                  ref={loginFormRef}
                  onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                  className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300"
                  aria-label="Login form"
                  noValidate
                >
                  <FieldGroup>
                    <Field className="space-y-2.5">
                      <FieldLabel htmlFor="email" className="text-sm font-semibold text-foreground">
                        Email Address
                      </FieldLabel>
                      <div className="relative">
                        <HiOutlineEnvelope
                          className={cn(
                            "absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 pointer-events-none transition-colors z-10",
                            loginForm.formState.errors.email
                              ? "text-destructive"
                              : loginForm.watch('email') && loginForm.formState.isValid
                              ? "text-green-600 dark:text-green-500"
                              : "text-muted-foreground"
                          )}
                          aria-hidden="true"
                        />
                        <Controller
                          control={loginForm.control}
                          name="email"
                          render={({ field, fieldState }) => (
                            <>
                              <Input
                                {...field}
                                id="email"
                                type="email"
                                autoComplete="email"
                                inputMode="email"
                                placeholder="admin@example.com"
                                disabled={loading || isTransitioning}
                                aria-invalid={fieldState.invalid}
                                className={cn(
                                  'pl-10 h-11 text-base transition-all duration-200 bg-background',
                                  fieldState.error && 'border-destructive focus-visible:ring-destructive animate-shake',
                                  !fieldState.error &&
                                    field.value &&
                                    loginForm.formState.isValid &&
                                    'border-green-500/60 focus-visible:ring-green-500/20 focus-visible:border-green-500/80'
                                )}
                                autoFocus
                                onChange={(e) => {
                                  field.onChange(e)
                                  setEmail(e.target.value)
                                  setApiError(null)
                                }}
                              />
                              {!fieldState.error &&
                                field.value &&
                                loginForm.formState.isValid && (
                                  <p
                                    className="text-sm text-green-600 dark:text-green-500 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-300 mt-2 font-medium"
                                    aria-live="polite"
                                  >
                                    <HiOutlineCheckCircle
                                      className="h-4 w-4 animate-in zoom-in duration-300"
                                      aria-hidden="true"
                                    />
                                    Valid email address
                                  </p>
                                )}
                              <FieldError errors={fieldState.error ? [fieldState.error] : undefined} className="flex items-center gap-1.5 text-sm font-medium mt-2" />
                            </>
                          )}
                        />
                      </div>
                    </Field>

                    <Field className="space-y-2.5">
                      <FieldLabel htmlFor="password" className="text-sm font-semibold text-foreground">
                        Password
                      </FieldLabel>
                      <Controller
                        control={loginForm.control}
                        name="password"
                        render={({ field, fieldState }) => (
                          <>
                            <PasswordInput
                              {...field}
                              id="password"
                              autoComplete="current-password"
                              placeholder="Enter your password"
                              disabled={loading || isTransitioning}
                              aria-invalid={fieldState.invalid}
                              className={cn(
                                'h-11 text-base transition-all duration-200 bg-background',
                                fieldState.error && 'animate-shake border-destructive focus-visible:ring-destructive',
                                !fieldState.error && field.value && 'border-border focus-visible:ring-ring'
                              )}
                              onChange={(e) => {
                                field.onChange(e)
                                setApiError(null)
                              }}
                            />
                            <FieldError errors={fieldState.error ? [fieldState.error] : undefined} className="flex items-center gap-1.5 text-sm font-medium" />
                          </>
                        )}
                      />
                    </Field>
                  </FieldGroup>

                {/* Remember Email Checkbox */}
                <div className="flex items-center space-x-2.5 pt-1">
                  <Checkbox
                    id="remember-email"
                    checked={rememberEmail}
                    onCheckedChange={(checked) => {
                      const isChecked = checked === true
                      setRememberEmail(isChecked)
                      if (!isChecked) {
                        localStorage.removeItem(REMEMBER_EMAIL_KEY)
                      }
                    }}
                    disabled={loading || isTransitioning}
                    className="h-4 w-4"
                    aria-describedby="remember-email-description"
                  />
                  <Label
                    htmlFor="remember-email"
                    className="text-sm font-medium cursor-pointer select-none text-foreground/90 hover:text-foreground transition-colors leading-none"
                  >
                    Remember my email
                  </Label>
                  <span id="remember-email-description" className="sr-only">
                    Save your email address for future logins
                  </span>
                </div>

                {/* API Error Message */}
                {apiError && step === 'login' && (
                  <div
                    role="alert"
                    aria-live="assertive"
                    className="p-4 rounded-lg bg-destructive/10 dark:bg-destructive/20 border border-destructive/40 dark:border-destructive/50 flex items-start gap-3 animate-in fade-in slide-in-from-top-1 duration-300 shadow-sm backdrop-blur-sm"
                  >
                    <HiOutlineExclamationCircle
                      className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5 animate-pulse"
                      aria-hidden="true"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-destructive dark:text-destructive-foreground leading-relaxed">
                        {apiError}
                      </p>
                      {canRetry && (
                        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                          Please check your connection and try again.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 text-base font-semibold shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-md group"
                  disabled={loading || isTransitioning || isOffline}
                  aria-label={loading ? 'Sending OTP, please wait' : 'Continue to OTP verification'}
                >
                  {loading ? (
                    <span className="flex items-center gap-2" aria-hidden="true">
                      <div
                        className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                        aria-hidden="true"
                      />
                      Sending OTP...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Continue
                      <HiArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
                    </span>
                  )}
                </Button>
              </form>
            )}

            {step === 'otp' && (
                <form
                  onSubmit={otpForm.handleSubmit(onOTPSubmit)}
                  className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300"
                  aria-label="OTP verification form"
                  noValidate
                >
                  <div className="space-y-5">
                    <div className="text-center space-y-2">
                      <Label
                        htmlFor="otp-input"
                        className="text-base font-semibold"
                        id="otp-label"
                      >
                        Enter verification code
                      </Label>
                      <p
                        className="text-sm text-muted-foreground"
                        id="otp-description"
                        aria-live="polite"
                      >
                        We sent a 6-digit code to{' '}
                        <span className="font-medium text-foreground break-all">{email}</span>
                      </p>
                    </div>

                    <Field className="space-y-3">
                      <Controller
                        control={otpForm.control}
                        name="otp"
                        render={({ field, fieldState }) => (
                          <>
                            <div
                              ref={otpInputRef}
                              role="group"
                              aria-labelledby="otp-label"
                              aria-describedby="otp-description"
                            >
                              <div id="otp-input">
                                <OTPInput
                                  value={field.value || ''}
                                  onChange={field.onChange}
                                  disabled={loading || isTransitioning || isOffline}
                                  error={!!fieldState.error}
                                  aria-invalid={fieldState.invalid}
                                />
                              </div>
                            </div>
                            {!fieldState.error && field.value?.length === 6 && (
                              <p
                                className="text-sm text-green-600 dark:text-green-400 text-center flex items-center justify-center gap-1 animate-in fade-in zoom-in-95 duration-300"
                                aria-live="polite"
                              >
                                <HiOutlineCheckCircle
                                  className="h-4 w-4 animate-in zoom-in duration-300"
                                  aria-hidden="true"
                                />
                                Code entered
                              </p>
                            )}
                            <FieldError errors={fieldState.error ? [fieldState.error] : undefined} className="text-center flex items-center justify-center gap-1" />
                          </>
                        )}
                      />
                    </Field>

                  {/* API Error Message */}
                  {apiError && step === 'otp' && (
                    <div
                      role="alert"
                      aria-live="assertive"
                      className="p-3 rounded-md bg-destructive/10 dark:bg-destructive/20 border border-destructive/20 dark:border-destructive/30 flex items-start gap-2 animate-in fade-in slide-in-from-top-1 duration-300"
                    >
                      <HiOutlineExclamationCircle
                        className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5 animate-pulse"
                        aria-hidden="true"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-destructive dark:text-destructive-foreground">
                          {apiError}
                        </p>
                        {canRetry && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Please verify the code and try again.
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* OTP Resend */}
                  <div className="text-center space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Didn't receive code?
                    </p>
                    {countdown > 0 ? (
                      <p
                        className="text-sm text-muted-foreground"
                        aria-live="polite"
                        role="timer"
                        aria-atomic="true"
                      >
                        Resend available in{' '}
                        <span className="font-medium text-foreground">{countdown}</span> seconds
                      </p>
                    ) : (
                      <Button
                        type="button"
                        variant="link"
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        onClick={async () => {
                          try {
                            setApiError(null)
                            await resendOTP()
                          } catch (error) {
                            // Error is handled by the hook and useAuth
                          }
                        }}
                        disabled={loading || isTransitioning || isResending || !canResend || isOffline}
                        aria-label={
                          isResending
                            ? 'Resending OTP, please wait'
                            : 'Resend verification code'
                        }
                      >
                        {isResending ? (
                          <span className="flex items-center gap-2">
                            <div
                              className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent"
                              aria-hidden="true"
                            />
                            Resending...
                          </span>
                        ) : (
                          <>
                            <span className="font-medium">Resend</span> code
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full transition-all hover:scale-[1.02] active:scale-[0.98]"
                      onClick={() => {
                        setStep('login')
                        setRequiresPasswordChange(false)
                        setApiError(null)
                        setTempPassword('') // Clear temp password when going back
                        resetCountdown()
                        otpForm.reset()
                        // Focus email input when going back
                        setTimeout(() => {
                          const emailInput = loginFormRef.current?.querySelector('#email') as HTMLInputElement
                          emailInput?.focus()
                        }, 100)
                      }}
                    disabled={loading || isTransitioning}
                    aria-label="Go back to login form"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="w-full transition-all hover:scale-[1.02] active:scale-[0.98]"
                    disabled={
                      loading ||
                      isTransitioning ||
                      otpForm.watch('otp')?.length !== 6 ||
                      isOffline
                    }
                    aria-label={loading ? 'Verifying OTP, please wait' : 'Verify OTP code'}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2" aria-hidden="true">
                        <div
                          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                          aria-hidden="true"
                        />
                        Verifying...
                      </span>
                    ) : (
                      'Verify OTP'
                    )}
                  </Button>
                </div>
              </form>
            )}

            {step === 'password-change' && (
                <form
                  ref={passwordChangeFormRef}
                  onSubmit={passwordChangeForm.handleSubmit(onPasswordChangeSubmit)}
                  className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300"
                  aria-label="Password change form"
                  noValidate
                >
                  <FieldGroup>
                    <Field className="space-y-2">
                      <FieldLabel htmlFor="new-password" className="text-sm font-medium flex items-center gap-2">
                        <HiOutlineLockClosed className="h-4 w-4" aria-hidden="true" />
                        New Password
                      </FieldLabel>
                      <Controller
                        control={passwordChangeForm.control}
                        name="newPassword"
                        render={({ field, fieldState }) => (
                          <>
                            <PasswordInput
                              {...field}
                              id="new-password"
                              autoComplete="new-password"
                              placeholder="Enter new password"
                              disabled={loading || isTransitioning || isOffline}
                              showStrength={true}
                              showRequirements={true}
                              aria-invalid={fieldState.invalid}
                              className={cn(
                                'transition-all',
                                fieldState.error && 'animate-shake border-destructive focus-visible:ring-destructive'
                              )}
                              autoFocus
                              onChange={(e) => {
                                field.onChange(e)
                                setApiError(null)
                              }}
                            />
                            <FieldError errors={fieldState.error ? [fieldState.error] : undefined} className="flex items-center gap-1" />
                          </>
                        )}
                      />
                    </Field>

                    <Field className="space-y-2">
                      <FieldLabel htmlFor="confirm-password" className="text-sm font-medium flex items-center gap-2">
                        <HiOutlineLockClosed className="h-4 w-4" aria-hidden="true" />
                        Confirm Password
                      </FieldLabel>
                      <Controller
                        control={passwordChangeForm.control}
                        name="confirmPassword"
                        render={({ field, fieldState }) => (
                          <>
                            <PasswordInput
                              {...field}
                              id="confirm-password"
                              autoComplete="new-password"
                              placeholder="Confirm new password"
                              disabled={loading || isTransitioning || isOffline}
                              aria-invalid={fieldState.invalid}
                              className={cn(
                                'transition-all',
                                fieldState.error && 'animate-shake border-destructive focus-visible:ring-destructive',
                                !fieldState.error &&
                                  field.value &&
                                  passwordChangeForm.watch('newPassword') === field.value &&
                                  'border-green-500/50 focus-visible:ring-green-500/20'
                              )}
                              onChange={(e) => {
                                field.onChange(e)
                                setApiError(null)
                              }}
                            />
                            {!fieldState.error &&
                              field.value &&
                              passwordChangeForm.watch('newPassword') === field.value && (
                                <p
                                  className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1 animate-in fade-in zoom-in-95 duration-300"
                                  aria-live="polite"
                                >
                                  <HiOutlineCheckCircle
                                    className="h-4 w-4 animate-in zoom-in duration-300"
                                    aria-hidden="true"
                                  />
                                  Passwords match
                                </p>
                              )}
                            <FieldError errors={fieldState.error ? [fieldState.error] : undefined} className="flex items-center gap-1" />
                          </>
                        )}
                      />
                    </Field>
                  </FieldGroup>

                {/* API Error Message */}
                {apiError && step === 'password-change' && (
                  <div
                    role="alert"
                    aria-live="assertive"
                    className="p-3 rounded-md bg-destructive/10 dark:bg-destructive/20 border border-destructive/20 dark:border-destructive/30 flex items-start gap-2 animate-in fade-in slide-in-from-top-1 duration-300"
                  >
                    <HiOutlineExclamationCircle
                      className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5 animate-pulse"
                      aria-hidden="true"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-destructive dark:text-destructive-foreground">
                        {apiError}
                      </p>
                      {canRetry && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Please check your connection and try again.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full transition-all hover:scale-[1.02] active:scale-[0.98]"
                      onClick={() => {
                        setStep('otp')
                        setApiError(null)
                        passwordChangeForm.reset()
                        setTempPassword('') // Clear temp password when moving to password change
                        // Focus OTP input when going back
                        setTimeout(() => {
                          const otpInput = otpInputRef.current?.querySelector('input') as HTMLInputElement
                          otpInput?.focus()
                        }, 100)
                      }}
                    disabled={loading || isTransitioning}
                    aria-label="Go back to OTP verification"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="w-full transition-all hover:scale-[1.02] active:scale-[0.98]"
                    disabled={loading || isTransitioning || isOffline}
                    aria-label={loading ? 'Changing password, please wait' : 'Change password and complete login'}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2" aria-hidden="true">
                        <div
                          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                          aria-hidden="true"
                        />
                        Changing password...
                      </span>
                    ) : (
                      'Change Password'
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

