import { useRef, useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface OTPInputProps {
  length?: number
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  error?: boolean
  className?: string
}

export function OTPInput({
  length = 6,
  value,
  onChange,
  disabled = false,
  error = false,
  className,
}: OTPInputProps) {
  const [otp, setOtp] = useState<string[]>(new Array(length).fill(''))
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    // Sync external value with internal state
    const newOtp = value.split('').slice(0, length)
    const paddedOtp = [...newOtp, ...new Array(length - newOtp.length).fill('')]
    setOtp(paddedOtp)
  }, [value, length])

  const handleChange = (index: number, newValue: string) => {
    // Only allow digits
    if (newValue && !/^\d$/.test(newValue)) {
      return
    }

    const newOtp = [...otp]
    newOtp[index] = newValue

    setOtp(newOtp)

    // Combine all values and call onChange
    const combinedValue = newOtp.join('')
    onChange(combinedValue)

    // Auto-focus next input if value entered
    if (newValue && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // If current input is empty, focus previous and clear it
        inputRefs.current[index - 1]?.focus()
        const newOtp = [...otp]
        newOtp[index - 1] = ''
        setOtp(newOtp)
        onChange(newOtp.join(''))
      } else {
        // Clear current input
        const newOtp = [...otp]
        newOtp[index] = ''
        setOtp(newOtp)
        onChange(newOtp.join(''))
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').slice(0, length)
    const pastedDigits = pastedData.split('').filter((char) => /^\d$/.test(char))

    if (pastedDigits.length > 0) {
      const newOtp = [...otp]
      pastedDigits.forEach((digit, index) => {
        if (index < length) {
          newOtp[index] = digit
        }
      })
      setOtp(newOtp)
      onChange(newOtp.join(''))

      // Focus the next empty input or the last input
      const nextEmptyIndex = newOtp.findIndex((val) => !val)
      const focusIndex = nextEmptyIndex === -1 ? length - 1 : Math.min(nextEmptyIndex, length - 1)
      inputRefs.current[focusIndex]?.focus()
    }
  }

  const handleFocus = (index: number) => {
    inputRefs.current[index]?.select()
  }

  return (
    <div className={cn('flex items-center justify-center gap-3', className)}>
      {otp.map((digit, index) => (
        <Input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={() => handleFocus(index)}
          disabled={disabled}
          className={cn(
            'h-14 w-14 text-center text-2xl font-semibold transition-all duration-300',
            'focus:ring-2 focus:ring-primary focus:border-primary focus:scale-105',
            'hover:border-primary/50',
            digit && 'border-primary/50 bg-primary/5',
            error && 'border-destructive focus:ring-destructive animate-shake',
            disabled && 'opacity-50 cursor-not-allowed',
            'shadow-sm'
          )}
        />
      ))}
    </div>
  )
}

