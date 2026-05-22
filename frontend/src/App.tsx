import type { ReactElement } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { getSession, roleDashboards, type UserRole } from './auth/session'
import { AdminPage } from './pages/AdminPage'
import { AuthPage } from './pages/AuthPage'
import { CourseDetailPage } from './pages/CourseDetailPage'
import { CoursesPage } from './pages/CoursesPage'
import { DashboardPage } from './pages/DashboardPage'
import { LandingPage } from './pages/LandingPage'
import { SuperAdminPage } from './pages/SuperAdminPage'

type ProtectedRouteProps = {
  allowedRoles: UserRole[]
  children: ReactElement
}

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

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/courses" element={<CoursesPage />} />
      <Route path="/courses/:slug" element={<CourseDetailPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
            <AdminPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin"
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <SuperAdminPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
