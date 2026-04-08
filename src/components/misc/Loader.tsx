import { useEffect, useState } from 'react'
import Logo from '@/components/layout/Logo'
import { cn } from '@/lib/utils'

interface LoaderProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  text?: string
  fullScreen?: boolean
}

export default function Loader({ 
  className, 
  size = 'md',
  text,
  fullScreen = false 
}: LoaderProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10)
    return () => clearTimeout(timer)
  }, [])

  // Size logic: fullScreen uses medium sizes, inline uses smallest sizes
  // Size prop can override for additional customization
  const getLogoSizes = () => {
    if (fullScreen) {
      // Medium sizes for initial page data loading
      return {
        sm: 'h-12 md:h-14 lg:h-16 w-auto',
        md: 'h-14 md:h-16 lg:h-18 w-auto',
        lg: 'h-16 md:h-18 lg:h-20 w-auto',
      }
    } else {
      // Smallest sizes for API calls and data fetching
      return {
        sm: 'h-6 md:h-8 lg:h-10 w-auto',
        md: 'h-8 md:h-10 lg:h-12 w-auto',
        lg: 'h-10 md:h-12 lg:h-14 w-auto',
      }
    }
  }

  const getBorderWidth = () => {
    if (fullScreen) {
      return {
        sm: '3px',
        md: '4px',
        lg: '4px',
      }
    } else {
      return {
        sm: '2px',
        md: '3px',
        lg: '3px',
      }
    }
  }

  const getInnerPadding = () => {
    if (fullScreen) {
      return {
        sm: '12px 16px',
        md: '14px 18px',
        lg: '16px 20px',
      }
    } else {
      return {
        sm: '6px 10px',
        md: '8px 12px',
        lg: '10px 14px',
      }
    }
  }

  const logoSizes = getLogoSizes()
  const borderWidth = getBorderWidth()
  const innerPadding = getInnerPadding()
  const gapSize = fullScreen ? 'gap-4' : 'gap-2'

  const containerClasses = fullScreen
    ? 'flex min-h-screen items-center justify-center'
    : 'flex items-center justify-center py-8'

  return (
    <div className={cn(containerClasses, className, "animate-in fade-in duration-300")}>
      <div className={cn("flex flex-col items-center", gapSize)}>
        {/* Logo with animated rectangular border */}
        <div
          className={cn(
            'relative transition-all duration-500 ease-out inline-block',
            isVisible
              ? 'scale-100 opacity-100'
              : 'scale-75 opacity-0'
          )}
          style={{
            borderRadius: '10px',
            padding: borderWidth[size],
            animation: isVisible ? 'gradient-border-chase 2.5s linear infinite' : 'none',
            background: isVisible
              ? 'conic-gradient(from 0deg, #FF8C00, #FF6600, #FF8C00, transparent 50%, transparent)'
              : 'transparent',
          }}
        >
          <div
            className="relative bg-background rounded-md"
            style={{
              padding: innerPadding[size],
            }}
          >
            <Logo 
              className={cn(logoSizes[size], 'drop-shadow-sm')} 
              clickable={false}
            />
          </div>
        </div>

        {text && (
          <p className={cn(
            'text-sm font-medium text-muted-foreground transition-opacity duration-500 ease-out',
            isVisible ? 'opacity-100' : 'opacity-0'
          )}>
            {text}
          </p>
        )}
      </div>
    </div>
  )
}

