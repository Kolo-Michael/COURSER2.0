export type UserRole = 'student' | 'admin' | 'super_admin'

export type AuthSession = {
  identifier: string
  role: UserRole
  email?: string
  fullName?: string | null
}

// Authentication tokens live in HttpOnly cookies set by the backend
// (access_token / refresh_token). JavaScript cannot read those. The
// backend also emits a non-HttpOnly `courser_session` JSON cookie that
// surfaces only the role + identifier so routing decisions can happen
// on the client without sending a probe request.
const SESSION_COOKIE = 'courser_session'
const LEGACY_STORAGE_KEY = 'courser.auth.session'

export const roleDashboards: Record<UserRole, string> = {
  student: '/dashboard',
  admin: '/admin',
  super_admin: '/super-admin',
}

/**
 * Returns the post-login route for a role. Centralized so every form
 * (login / signup) routes through the same redirect map.
 */
export function dashboardFor(role: UserRole): string {
  return roleDashboards[role] ?? '/dashboard'
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const target = `${name}=`
  const parts = document.cookie.split(';')
  for (const part of parts) {
    const trimmed = part.trim()
    if (trimmed.startsWith(target)) {
      return decodeURIComponent(trimmed.slice(target.length))
    }
  }
  return null
}

export function getSession(): AuthSession | null {
  const raw = readCookie(SESSION_COOKIE)

  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Partial<AuthSession>
      if (
        typeof parsed.identifier === 'string' &&
        (parsed.role === 'student' || parsed.role === 'admin' || parsed.role === 'super_admin')
      ) {
        return {
          identifier: parsed.identifier,
          role: parsed.role,
          email: typeof parsed.email === 'string' ? parsed.email : undefined,
          fullName:
            typeof parsed.fullName === 'string' || parsed.fullName === null
              ? parsed.fullName
              : undefined,
        }
      }
    } catch {
      // Ignore malformed cookie and fall back to legacy storage.
    }
  }

  // One-time migration: pre-hardening sessions saved by the old client
  // wrote tokens to localStorage. Read whatever's there so the UI keeps
  // working for users who haven't logged out / in yet, then clear it
  // so the value never lingers.
  if (typeof window !== 'undefined') {
    const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY)
    if (legacy) {
      try {
        const parsed = JSON.parse(legacy) as Partial<AuthSession>
        if (
          typeof parsed.identifier === 'string' &&
          (parsed.role === 'student' || parsed.role === 'admin' || parsed.role === 'super_admin')
        ) {
          return {
            identifier: parsed.identifier,
            role: parsed.role,
            email: typeof parsed.email === 'string' ? parsed.email : undefined,
            fullName:
              typeof parsed.fullName === 'string' || parsed.fullName === null
                ? parsed.fullName
                : undefined,
          }
        }
      } catch {
        // fall through
      }
      window.localStorage.removeItem(LEGACY_STORAGE_KEY)
    }
  }

  return null
}

/**
 * Cookies are server-set — keep this as a no-op so callers that still
 * `saveSession(...)` don't crash. The server's response is the source of
 * truth.
 */
export function saveSession(_session: AuthSession) {
  // intentionally empty
}

export function clearSession() {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(LEGACY_STORAGE_KEY)
  }
}
