import { HiOutlineMoon, HiOutlineSun } from 'react-icons/hi2'
import { Button } from '@/components/ui/button'
import { useThemeStore } from '@/stores/theme'
import { cn } from '@/lib/utils'

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useThemeStore()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className={cn('transition-colors duration-200', className)}
      aria-label="Toggle theme"
    >
      {theme === 'light' ? (
        <HiOutlineMoon className="h-5 w-5 transition-transform duration-200" />
      ) : (
        <HiOutlineSun className="h-5 w-5 transition-transform duration-200" />
      )}
    </Button>
  )
}

