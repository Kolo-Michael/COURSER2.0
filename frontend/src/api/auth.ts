// ─── auth.ts : authentication & account API ─────────────────────────────
// Thin typed wrappers over the backend auth endpoints: token-based login
// /signup that hands off to HttpOnly cookies, password-reset flow, and
// profile/settings updates. Types here mirror the FastAPI response shape.
import { apiRequest } from './client'
import type { UserRole } from '@/auth/session'

/** Full user record returned by the auth endpoints. */
export type ApiUser = {
  id: string
  username: string
  email: string
  full_name: string | null
  role: UserRole
  is_active: boolean
  is_verified: boolean
  avatar_url: string | null
  nav_style: 'sidebar' | 'floating'
  nav_collapsed: boolean
  created_at: string
  updated_at: string | null
  last_login: string | null
}

/** Navigation display preferences synced between device and account. */
export type NavStyle = 'sidebar' | 'floating'

/** Fields the user can edit about themselves via PATCH /auth/me. */
export type ProfileUpdatePayload = {
  username?: string
  full_name?: string
  avatar_url?: string | null
  nav_style?: NavStyle
  nav_collapsed?: boolean
}

// Tokens are stored in HttpOnly cookies by the backend, BUT on cross-origin
// Safari/iOS (ITP) those cookies are blocked. The backend also emits the
// access_token in the JSON body + the courser_session cookie payload, so the
// SPA can fall back to storing it in a readable cookie and sending it as a
// Bearer header. LoginResponse extends the user payload with those tokens.
export type LoginResponse = {
  user: ApiUser
  access_token?: string
  refresh_token?: string
}

export type SignupPayload = {
  username: string
  email: string
  password: string
  full_name?: string
  role?: UserRole
}

export type ForgotPasswordPayload = {
  email: string
}

export type VerifyCodePayload = {
  email: string
  code: string
}

export type ResetPasswordPayload = {
  email: string
  code: string
  new_password: string
}

export type RefreshResponse = { user: ApiUser }

/**
 * GET /api/auth/me
 * Returns the authenticated user (resolved from the access-token cookie).
 */
export function getMe() {
  return apiRequest<ApiUser>('/api/auth/me')
}

/**
 * POST /api/auth/login
 * `identifier` accepts an email address or a username (or pass `email` for
 * the legacy mobile field). Returns access + (optional) refresh tokens plus
 * the authenticated user. Throws ApiRequestError with status 403 when the
 * email isn't verified yet.
 */
export function login(identifier: string, password: string, rememberMe = false) {
  return apiRequest<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier, password, remember_me: rememberMe }),
  })
}

/**
 * POST /api/auth/logout
 * Revokes the server-side session and clears the auth cookies.
 */
export function logout() {
  return apiRequest<void>('/api/auth/logout', {
    method: 'POST',
  })
}

/**
 * POST /api/auth/signup
 * Registers a new user and returns access + (optional) refresh tokens plus the new user.
 */
export function signup(payload: SignupPayload) {
  return apiRequest<LoginResponse>('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/**
 * POST /api/auth/forgot-password
 * Requests a password reset code for the given email.
 */
export function forgotPassword(payload: ForgotPasswordPayload) {
  return apiRequest<{ message: string }>('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/**
 * POST /api/auth/verify-code
 * Verifies a password reset code.
 */
export function verifyCode(payload: VerifyCodePayload) {
  return apiRequest<{ message: string; valid: boolean }>('/api/auth/verify-code', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/**
 * POST /api/auth/reset-password
 * Resets the user's password using a verified code.
 */
export function resetPassword(payload: ResetPasswordPayload) {
  return apiRequest<{ message: string }>('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/**
 * POST /api/auth/refresh
 * The refresh token is read from the HttpOnly cookie set by the backend,
 * so no body is required. Issues a fresh access token + rotates the refresh.
 */
export function refresh() {
  return apiRequest<{ user: ApiUser }>('/api/auth/refresh', {
    method: 'POST',
  })
}

export type AdminCreatePayload = {
  username: string
  email: string
  password: string
  full_name?: string
  role: 'admin' | 'super_admin'
}

/** POST /api/auth/admin — create a new admin / super-admin (privileged). */
export function createAdmin(payload: AdminCreatePayload) {
  return apiRequest<ApiUser>('/api/auth/admin', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/**
 * PATCH /api/auth/me
 * Self-service profile & settings update (display name, avatar, nav prefs).
 */
export function updateProfile(payload: ProfileUpdatePayload) {
  return apiRequest<ApiUser>('/api/auth/me', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

/**
 * POST /api/auth/change-password
 * Requires the current password plus a new one (min 8 chars).
 */
export function changePassword(currentPassword: string, newPassword: string) {
  return apiRequest<{ message: string }>('/api/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
  })
}

/**
 * @deprecated Use {@link signup} instead — kept as an alias to avoid breaking
 * any legacy imports during the migration.
 */
export const register = signup
