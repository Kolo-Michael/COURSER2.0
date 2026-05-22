export type UserRole = 'student' | 'admin' | 'super_admin'

export type AuthSession = {
  identifier: string
  role: UserRole
  token?: string
  email?: string
  fullName?: string | null
}

const SESSION_KEY = 'courser.auth.session'

export const roleDashboards: Record<UserRole, string> = {
  student: '/dashboard',
  admin: '/admin',
  super_admin: '/super-admin',
}

export function getSession(): AuthSession | null {
  const raw = window.localStorage.getItem(SESSION_KEY)

  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AuthSession>

    if (
      typeof parsed.identifier === 'string' &&
      (parsed.role === 'student' || parsed.role === 'admin' || parsed.role === 'super_admin')
    ) {
      return {
        identifier: parsed.identifier,
        role: parsed.role,
        token: typeof parsed.token === 'string' ? parsed.token : undefined,
        email: typeof parsed.email === 'string' ? parsed.email : undefined,
        fullName: typeof parsed.fullName === 'string' || parsed.fullName === null ? parsed.fullName : undefined,
      }
    }
  } catch {
    window.localStorage.removeItem(SESSION_KEY)
  }

  return null
}

export function saveSession(session: AuthSession) {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function clearSession() {
  window.localStorage.removeItem(SESSION_KEY)
}
