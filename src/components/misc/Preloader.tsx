import { useEffect, useState } from 'react'
import Logo from '@/components/layout/Logo'
import { cn } from '@/lib/utils'

interface PreloaderProps {
  className?: string
  fullScreen?: boolean
  text?: string
}

export default function Preloader({ 
  className, 
  fullScreen = true,
  text 
}: PreloaderProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Trigger animation after mount
    const timer = setTimeout(() => setIsVisible(true), 10)
    return () => clearTimeout(timer)
  }, [])

  const containerClasses = fullScreen
    ? 'fixed inset-0 z-50 flex min-h-screen items-center justify-center bg-background/95 backdrop-blur-sm'
    : 'flex items-center justify-center py-8'

  return (
    <div className={cn(containerClasses, className, 'animate-in fade-in duration-300')}>
      <div className="flex flex-col items-center gap-8">
        {/* Logo with animated rectangular border */}
        <div
          className={cn(
            'relative transition-all duration-700 ease-out inline-block',
            isVisible
              ? 'scale-100 opacity-100'
              : 'scale-75 opacity-0'
          )}
          style={{
            borderRadius: '12px',
            padding: '4px',
            animation: isVisible ? 'gradient-border-chase 2.5s linear infinite' : 'none',
            background: isVisible
              ? 'conic-gradient(from 0deg, #FF8C00, #FF6600, #FF8C00, transparent 50%, transparent)'
              : 'transparent',
          }}
        >
          <div
            className="relative bg-background rounded-lg"
            style={{
              padding: '20px 28px',
            }}
          >
            <Logo 
              className="h-20 w-auto md:h-24 lg:h-28 drop-shadow-lg" 
              clickable={false}
            />
          </div>
        </div>

        {/* Optional text */}
        {text && (
          <p className={cn(
            'text-sm font-medium text-muted-foreground transition-opacity duration-700 ease-out',
            isVisible ? 'opacity-100' : 'opacity-0'
          )}>
            {text}
          </p>
        )}
      </div>

    </div>
  )
}
