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


// Users
const UsersPage = lazy(() => import('./pages/users/UsersPage'))
const UserDetailPage = lazy(() => import('./pages/users/UserDetailPage'))






// RBAC
const RolesPage = lazy(() => import('./pages/rbac/RolesPage'))
const RoleDetailPage = lazy(() => import('./pages/rbac/RoleDetailPage'))
const PermissionsPage = lazy(() => import('./pages/rbac/PermissionsPage'))


// Admins
const AdminsPage = lazy(() => import('./pages/admins/AdminsPage'))
const AdminDetailPage = lazy(() => import('./pages/admins/AdminDetailPage'))

// System
const SystemConfigPage = lazy(() => import('./pages/system/SystemConfigPage'))

// Activity
const ActivityLogsPage = lazy(() => import('./pages/activity/ActivityLogsPage'))
const ActivityLogDetailPage = lazy(() => import('./pages/activity/ActivityLogDetailPage'))

// Notifications
const SendNotificationPage = lazy(() => import('./pages/notifications/SendNotificationPage'))
const BroadcastNotificationPage = lazy(() => import('./pages/notifications/BroadcastNotificationPage'))


// Webhooks
const WebhooksPage = lazy(() => import('./pages/webhooks/WebhooksPage'))

// Workers
const WorkersPage = lazy(() => import('./pages/workers/WorkersPage'))
const WorkerDetailPage = lazy(() => import('./pages/workers/WorkerDetailPage'))
const QueuesPage = lazy(() => import('./pages/workers/QueuesPage'))


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


            {/* Users */}
            <Route path="users" element={<LazyRoute><UsersPage /></LazyRoute>} />
            <Route path="users/:id" element={<LazyRoute><UserDetailPage /></LazyRoute>} />






            {/* RBAC */}
            <Route path="rbac/roles" element={<LazyRoute><RolesPage /></LazyRoute>} />
            <Route path="rbac/roles/:id" element={<LazyRoute><RoleDetailPage /></LazyRoute>} />
            <Route path="rbac/permissions" element={<LazyRoute><PermissionsPage /></LazyRoute>} />


            {/* Admins */}
            <Route path="admins" element={<LazyRoute><AdminsPage /></LazyRoute>} />
            <Route path="admins/:id" element={<LazyRoute><AdminDetailPage /></LazyRoute>} />

            {/* System */}
            <Route path="system/config" element={<LazyRoute><SystemConfigPage /></LazyRoute>} />

            {/* Activity */}
            <Route path="activity" element={<LazyRoute><ActivityLogsPage /></LazyRoute>} />
            <Route path="activity/:type/:id" element={<LazyRoute><ActivityLogDetailPage /></LazyRoute>} />

            {/* Notifications */}
            <Route path="notifications/send" element={<LazyRoute><SendNotificationPage /></LazyRoute>} />
            <Route path="notifications/broadcast" element={<LazyRoute><BroadcastNotificationPage /></LazyRoute>} />


            {/* Webhooks */}
            <Route path="webhooks" element={<LazyRoute><WebhooksPage /></LazyRoute>} />

            {/* Workers */}
            <Route path="workers" element={<LazyRoute><WorkersPage /></LazyRoute>} />
            <Route path="workers/:name" element={<LazyRoute><WorkerDetailPage /></LazyRoute>} />
            <Route path="queues" element={<LazyRoute><QueuesPage /></LazyRoute>} />

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

