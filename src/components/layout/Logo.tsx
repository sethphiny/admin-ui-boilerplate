import { cn } from '@/lib/utils'
import { Link } from 'react-router-dom'
import { useThemeStore } from '@/stores/theme'

interface LogoProps {
  className?: string
  clickable?: boolean
}

export default function Logo({ className, clickable = true }: LogoProps) {
  const { theme } = useThemeStore()
  
  // Base brand colors
  // Primary accent remains vibrant in both themes
  const orangePrimary = '#FF8C00'
  const orangeSecondary = '#FF6600'
  
  // Text colors adapt to theme
  const textColor = theme === 'dark' ? '#E5E5E5' : '#1A1A1A'
  
  const logoElement = (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      </div>
      {!className?.includes('h-') && (
        <span className="text-xl font-bold tracking-tight text-foreground">
          Admin<span className="text-primary">BP</span>
        </span>
      )}
    </div>
  )
  
  if (clickable) {
    return (
      <Link to="/dashboard" className="flex items-center">
        {logoElement}
      </Link>
    )
  }
  
  return logoElement
}

