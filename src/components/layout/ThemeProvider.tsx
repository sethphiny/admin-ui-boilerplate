import { useEffect } from 'react'
import { useThemeStore } from '@/stores/theme'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useThemeStore()

  useEffect(() => {
    // Apply theme class to document root
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
  }, [theme])

  // Initialize theme on mount
  useEffect(() => {
    const { theme: initialTheme } = useThemeStore.getState()
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(initialTheme)
  }, [])

  return <>{children}</>
}

