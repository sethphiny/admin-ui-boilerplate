import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark'

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const getSystemTheme = (): Theme => {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: getSystemTheme(),
      setTheme: (theme) => {
        set({ theme })
        if (typeof document !== 'undefined') {
          document.documentElement.classList.remove('light', 'dark')
          document.documentElement.classList.add(theme)
        }
      },
      toggleTheme: () => {
        const newTheme = get().theme === 'light' ? 'dark' : 'light'
        get().setTheme(newTheme)
      },
    }),
    {
      name: 'theme-storage',
      onRehydrateStorage: () => (state) => {
        if (state && typeof document !== 'undefined') {
          // Apply theme class on rehydration
          document.documentElement.classList.remove('light', 'dark')
          document.documentElement.classList.add(state.theme)
        }
      },
    }
  )
)

// Initialize theme immediately on module load (before React hydration)
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('theme-storage')
  if (stored) {
    try {
      const parsed = JSON.parse(stored)
      if (parsed.state?.theme) {
        document.documentElement.classList.remove('light', 'dark')
        document.documentElement.classList.add(parsed.state.theme)
      }
    } catch {
      // Fallback to system preference
      const systemTheme = getSystemTheme()
      document.documentElement.classList.remove('light', 'dark')
      document.documentElement.classList.add(systemTheme)
    }
  } else {
    // No stored preference, use system preference
    const systemTheme = getSystemTheme()
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(systemTheme)
  }
}

