// ─── client.ts : shared fetch wrapper for every API call ────────────────
// Single wrapper that fetches JSON from the backend, sends HttpOnly auth
// cookies on every request, and turns FastAPI error bodies into one-line
// messages. All API modules (auth/courses/streak) go through apiRequest().
//
// The SPA and API share one origin: in dev a Vite proxy forwards /api to
// the local FastAPI server (see vite.config.ts), and in prod (Vercel single
// project) they're literally the same origin. Keep API_BASE_URL empty so
// cookies stay same-origin and readable by getSession(). Set
// VITE_API_BASE_URL to a different origin only if the deployments split.
// Exposed so components can build absolute links (e.g. the "Sign in with
// Google" button navigates to {API_BASE_URL}/api/auth/google).
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

// Endpoints whose 401 is a normal business result (bad credentials), NOT an
// expired/invalid session. These must not trigger the refresh/redirect path.
const AUTH_EXPECTED_401: RegExp[] = [
  /^\/api\/auth\/login$/,
  /^\/api\/auth\/signup$/,
  /^\/api\/auth\/forgot-password$/,
  /^\/api\/auth\/verify-code$/,
  /^\/api\/auth\/reset-password$/,
]

// Single-flight refresh: concurrent 401s all wait on the same attempt so we
// never fire parallel refresh requests.
let refreshPromise: Promise<boolean> | null = null

/** POST /api/auth/refresh with the HttpOnly refresh_token cookie. */
function postRefresh(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })
      .then((r) => r.ok)
      .catch(() => false)
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

/**
 * Handle a 401 on an authenticated call: try a single refresh, and if that
 * fails, clear the stale session cookies and bounce to /auth (without
 * clobbering an already-open auth page).
 */
async function handleUnauthorized(path: string): Promise<boolean> {
  if (AUTH_EXPECTED_401.some((re) => re.test(path))) return false
  const refreshed = await postRefresh()
  if (refreshed) return true
  // Refresh failed → the tokens are genuinely invalid (e.g. secret changed).
  // Clear cookies so getSession() stops reporting a phantom login and the
  // endless 401 loop ends.
  document.cookie = 'courser_session=; Max-Age=0; Path=/'
  document.cookie = 'access_token=; Max-Age=0; Path=/'
  document.cookie = 'refresh_token=; Max-Age=0; Path=/'
  if (typeof window !== 'undefined' && window.location.pathname !== '/auth') {
    window.location.assign('/auth')
  }
  return false
}

/**
 * Perform a JSON API request.
 * @param path API path (e.g. '/api/courses')
 * @param options Extra fetch options; 'headers' is spread last so callers
 *   can add overrides on top of the default JSON content type
 * @returns parsed JSON body, or `undefined` for HTTP 204 responses
 * @throws Error with a readable message built from the API error body
 */
export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  return apiRequestOnce<T>(path, options)
}

/**
 * Inner fetch wrapper. `retried` guards the refresh path so a single request
 * is only ever refreshed once — a second 401 on the retry is treated as a
 * genuine auth failure (bounced to /auth) rather than retried forever.
 */
async function apiRequestOnce<T>(path: string, options: RequestInit = {}, retried = false): Promise<T> {
  const { headers, ...rest } = options
  // multipart uploads set their own Content-Type (with a boundary), so the
  // default JSON content-type must not be applied when the body is FormData.
  const isFormData = typeof FormData !== 'undefined' && rest.body instanceof FormData
  const response = await fetch(`${API_BASE_URL}${path}`, {
    // Include HttpOnly auth cookies on every request.
    credentials: 'include',
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...headers,
    },
    ...rest,
  })

  // A 401 on an authenticated endpoint usually means the access token is
  // stale (expired or signed under an old SECRET_KEY). Refresh once and, on
  // success, transparently retry the original request. Fall back to the
  // error path when refresh can't recover (bounced to /auth in that case).
  if (response.status === 401 && !AUTH_EXPECTED_401.some((re) => re.test(path)) && !retried) {
    if (await handleUnauthorized(path)) {
      return apiRequestOnce<T>(path, options, true)
    }
  }

  if (!response.ok) {
    const text = await response.text()
    const readable = readableError(text, response.status)
    const error = new ApiRequestError(readable || `Request failed with status ${response.status}`, response.status)
    // Attach any extra JSON fields (e.g. the `email` on a 403 not-verified
    // login) so callers can read them off the error object.
    try {
      const data = JSON.parse(text)
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        const { detail, ...rest } = data as Record<string, unknown>
        if (Object.keys(rest).length > 0) Object.assign(error, rest)
      }
    } catch {
      // Non-JSON body — nothing extra to attach.
    }
    throw error
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

/** Turn FastAPI/DRF-style error bodies into a readable single line. */
function readableError(body: string, status: number): string | null {
  try {
    const data = JSON.parse(body)
    if (Array.isArray(data.detail)) {
      // Pydantic 422: [{ loc, msg, input }]
      const parts = data.detail.map((item: { loc?: unknown[]; msg?: string }) => {
        const field = Array.isArray(item.loc) && item.loc.length > 0 ? item.loc[item.loc.length - 1] : null
        return field ? `${field}: ${item.msg ?? 'invalid value'}` : item.msg ?? 'invalid value'
      })
      return parts.join('; ')
    }
    if (typeof data.detail === 'string') return data.detail
    return null
  } catch {
    return status >= 500 ? null : body || null
  }
}

/**
 * API error that also carries the HTTP status, so callers can branch on it
 * (e.g. a 403 from login means "email not verified yet", not bad credentials).
 */
export class ApiRequestError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiRequestError'
    this.status = status
  }
}
