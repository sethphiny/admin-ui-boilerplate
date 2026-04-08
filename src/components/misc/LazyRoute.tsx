import { Suspense, type ReactNode } from 'react'
import Preloader from './Preloader'

interface LazyRouteProps {
  children: ReactNode
}

/**
 * Wrapper component for lazy-loaded routes
 * Provides consistent loading UI during code splitting
 */
export default function LazyRoute({ children }: LazyRouteProps) {
  return (
    <Suspense fallback={<Preloader fullScreen />}>
      {children}
    </Suspense>
  )
}

