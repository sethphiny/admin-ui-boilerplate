import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import LoginPage from './pages/auth/LoginPage'
import DashboardLayout from './layouts/DashboardLayout'
import ProtectedRoute from './components/auth/ProtectedRoute'
import { ErrorBoundary } from './components/misc/ErrorBoundary'
import LazyRoute from './components/misc/LazyRoute'
import Preloader from './components/misc/Preloader'

// Critical path components - keep static for immediate loading
// All page components are lazy-loaded for code splitting

// Dashboard
const DashboardPage = lazy(() => import('./pages/DashboardPage'))


// Partners
const PartnersPage = lazy(() => import('./pages/partners/PartnersPage'))

// KYC
const KycSessionsPage = lazy(() => import('./pages/kyc/KycSessionsPage'))






// Webhooks
const WebhooksPage = lazy(() => import('./pages/webhooks/WebhooksPage'))
const WebhookLogsPage = lazy(() => import('./pages/webhooks/WebhookLogsPage'))


function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<Preloader fullScreen />}>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<LazyRoute><DashboardPage /></LazyRoute>} />


            {/* Partners */}
            <Route path="partners" element={<LazyRoute><PartnersPage /></LazyRoute>} />

            {/* KYC */}
            <Route path="kyc" element={<LazyRoute><KycSessionsPage /></LazyRoute>} />

            {/* Webhooks */}
            <Route path="webhooks" element={<LazyRoute><WebhooksPage /></LazyRoute>} />
            <Route path="webhook-logs" element={<LazyRoute><WebhookLogsPage /></LazyRoute>} />

          </Route>

          {/* Catch all - redirect to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
      <Toaster />
    </ErrorBoundary>
  )
}

export default App

