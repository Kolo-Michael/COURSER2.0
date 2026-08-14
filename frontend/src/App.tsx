// ─── App: root router ───────────────────────────────────────────────────────
// Declares every public + protected route in the app. Public routes
// ("/", "/auth", "/courses") render for anyone; protected routes wrap
// their page in <ProtectedRoute> so only authenticated users matching
// the allowed role set can access them (see ProtectedRoute below).

import type { ReactElement } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { getSession, roleDashboards, type UserRole } from './auth/session'
import { AdminPage } from './pages/AdminPage'
import { AuthPage } from './pages/AuthPage'
import { CourseDetailPage } from './pages/CourseDetailPage'
import { CoursesPage } from './pages/CoursesPage'
import { DashboardPage } from './pages/DashboardPage'
import { LandingPage } from './pages/LandingPage'
import { SettingsPage } from './pages/SettingsPage'
import { StreakPage } from './pages/StreakPage'
import { SuperAdminPage } from './pages/SuperAdminPage'

type ProtectedRouteProps = {
  allowedRoles: UserRole[]
  children: ReactElement
}

// Route guard used on every protected route.
// - Reads the session cookie via getSession(); a null session redirects
//   to /auth.
// - If the current user's role is not in allowedRoles, redirect to that
//   role's default dashboard (roleDashboards maps role -> route, so a
//   student hitting /admin goes to /dashboard instead).
// - Otherwise renders the wrapped page.
function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const session = getSession()

  if (!session) {
    return <Navigate to="/auth" replace />
  }

  if (!allowedRoles.includes(session.role)) {
    return <Navigate to={roleDashboards[session.role]} replace />
  }

  return children
}

// App: the top-level React component. Renders the route table once;
// no layout state lives here (pages pick their own shell).
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/courses" element={<CoursesPage />} />
      {/* /courses/:slug is public — the detail page adapts its shell
          (DashboardLayout vs PublicShell) based on whether a session exists. */}
      <Route path="/courses/:slug" element={<CourseDetailPage />} />
      {/* Personal workspace: every signed-in role may land here. */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={['student', 'admin', 'super_admin']}>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/streak"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            {/* Streak is a student-only feature. */}
            <StreakPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
            {/* Course admin workspace — admins and super admins. */}
            <AdminPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin"
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            {/* Platform provisioning — super admins only. */}
            <SuperAdminPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute allowedRoles={['student', 'admin', 'super_admin']}>
            {/* Settings apply to every role. */}
            <SettingsPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
