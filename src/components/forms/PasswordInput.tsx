import { useState, forwardRef, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import type { InputProps } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { HiOutlineEye, HiOutlineEyeSlash } from 'react-icons/hi2'
import { cn } from '@/lib/utils'

type PasswordInputProps = Omit<InputProps, 'type'> & {
  /**
   * Optional accessible label for the toggle button.
   * Defaults to "Show password" / "Hide password".
   */
  toggleLabel?: string
  /**
   * Show password strength indicator
   */
  showStrength?: boolean
  /**
   * Show password requirements checklist
   */
  showRequirements?: boolean
}

type PasswordStrength = 'weak' | 'medium' | 'strong'

function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return 'weak'
  
  let strength = 0
  if (password.length >= 8) strength++
  if (password.length >= 12) strength++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++
  if (/\d/.test(password)) strength++
  if (/[^a-zA-Z\d]/.test(password)) strength++
  
  if (strength <= 2) return 'weak'
  if (strength <= 4) return 'medium'
  return 'strong'
}

function checkPasswordRequirements(password: string) {
  return {
    minLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[^a-zA-Z\d]/.test(password),
  }
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(function PasswordInput(
  { className, toggleLabel, showStrength = false, showRequirements = false, ...props },
  ref
) {
  const [isVisible, setIsVisible] = useState(false)
  const password = typeof props.value === 'string' ? props.value : ''
  
  const strength = useMemo(() => getPasswordStrength(password), [password])
  const requirements = useMemo(() => checkPasswordRequirements(password), [password])

  const resolvedToggleLabel =
    toggleLabel || (isVisible ? 'Hide password' : 'Show password')

  const strengthColors = {
    weak: 'bg-red-500',
    medium: 'bg-yellow-500',
    strong: 'bg-green-500',
  }

  const strengthLabels = {
    weak: 'Weak',
    medium: 'Medium',
    strong: 'Strong',
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          {...props}
          type={isVisible ? 'text' : 'password'}
          className={cn('pr-10', className)}
          ref={ref}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
          onClick={() => setIsVisible((v) => !v)}
          aria-label={resolvedToggleLabel}
          disabled={props.disabled}
        >
          {isVisible ? (
            <HiOutlineEyeSlash className="h-4 w-4" />
          ) : (
            <HiOutlineEye className="h-4 w-4" />
          )}
        </Button>
      </div>
      
      {showStrength && password && (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full transition-all duration-300',
                  strengthColors[strength]
                )}
                style={{ width: strength === 'weak' ? '33%' : strength === 'medium' ? '66%' : '100%' }}
              />
            </div>
            <span className={cn(
              'text-xs font-medium',
              strength === 'weak' && 'text-red-600',
              strength === 'medium' && 'text-yellow-600',
              strength === 'strong' && 'text-green-600'
            )}>
              {strengthLabels[strength]}
            </span>
          </div>
        </div>
      )}
      
      {showRequirements && password && (
        <div className="space-y-1.5 pt-1">
          <p className="text-xs font-medium text-muted-foreground mb-1">Password requirements:</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs">
              <div className={cn(
                'h-1.5 w-1.5 rounded-full transition-colors',
                requirements.minLength ? 'bg-green-500' : 'bg-muted-foreground/30'
              )} />
              <span className={requirements.minLength ? 'text-foreground' : 'text-muted-foreground'}>
                At least 8 characters
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className={cn(
                'h-1.5 w-1.5 rounded-full transition-colors',
                requirements.hasUpper ? 'bg-green-500' : 'bg-muted-foreground/30'
              )} />
              <span className={requirements.hasUpper ? 'text-foreground' : 'text-muted-foreground'}>
                One uppercase letter
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className={cn(
                'h-1.5 w-1.5 rounded-full transition-colors',
                requirements.hasLower ? 'bg-green-500' : 'bg-muted-foreground/30'
              )} />
              <span className={requirements.hasLower ? 'text-foreground' : 'text-muted-foreground'}>
                One lowercase letter
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className={cn(
                'h-1.5 w-1.5 rounded-full transition-colors',
                requirements.hasNumber ? 'bg-green-500' : 'bg-muted-foreground/30'
              )} />
              <span className={requirements.hasNumber ? 'text-foreground' : 'text-muted-foreground'}>
                One number
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className={cn(
                'h-1.5 w-1.5 rounded-full transition-colors',
                requirements.hasSpecial ? 'bg-green-500' : 'bg-muted-foreground/30'
              )} />
              <span className={requirements.hasSpecial ? 'text-foreground' : 'text-muted-foreground'}>
                One special character
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
})


