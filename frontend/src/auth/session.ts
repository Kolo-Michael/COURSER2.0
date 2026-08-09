export type UserRole = 'student' | 'admin' | 'super_admin'

export type AuthSession = {
  identifier: string
  role: UserRole
  email?: string
  fullName?: string | null
  avatarUrl?: string | null
  navStyle?: 'sidebar' | 'floating'
  navCollapsed?: boolean
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

/**
 * Decode a courser_session cookie value into a plain object.
 *
 * The backend stores `encodeURIComponent(JSON.stringify(payload))`, so a
 * straightforward `decodeURIComponent` + `JSON.parse` works for current
 * sessions. Older sessions (written before the encoding fix) contain
 * Starlette's octal escapes (\054 for ',') and escaped quotes; normalize
 * those so stale cookies don't bounce logged-in users back to /auth.
 */
function parseSessionCookie(raw: string): Partial<AuthSession> | null {
  let json = raw
  try {
    json = decodeURIComponent(json)
  } catch {
    // value may already be plain text
  }
  // Handle legacy octal escapes (Starlette cookie writer): \054 = ',', \42 = '"'
  json = json.replace(/\\[0-7]{3}/g, (match) => String.fromCharCode(parseInt(match.slice(1), 8)))
  try {
    return JSON.parse(json) as Partial<AuthSession>
  } catch {
    return null
  }
}

export function getSession(): AuthSession | null {
  const raw = readCookie(SESSION_COOKIE)

  if (raw) {
    const parsed = parseSessionCookie(raw)
    if (
      parsed &&
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
        avatarUrl:
          typeof parsed.avatarUrl === 'string' || parsed.avatarUrl === null
            ? parsed.avatarUrl
            : undefined,
        navStyle: parsed.navStyle === 'floating' || parsed.navStyle === 'sidebar' ? parsed.navStyle : undefined,
        navCollapsed: typeof parsed.navCollapsed === 'boolean' ? parsed.navCollapsed : undefined,
      }
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
            avatarUrl:
              typeof parsed.avatarUrl === 'string' || parsed.avatarUrl === null
                ? parsed.avatarUrl
                : undefined,
            navStyle: parsed.navStyle === 'floating' || parsed.navStyle === 'sidebar' ? parsed.navStyle : undefined,
            navCollapsed: typeof parsed.navCollapsed === 'boolean' ? parsed.navCollapsed : undefined,
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
  // Clears every COURSER-owned cookie + storage key. The real logout
  // (server-side revocation) is handled by the caller via /auth/logout.
  const cookies = ['courser_session', 'access_token', 'refresh_token']
  for (const name of cookies) {
    document.cookie = `${name}=; Max-Age=0; Path=/`
  }
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(LEGACY_STORAGE_KEY)
  }
}
