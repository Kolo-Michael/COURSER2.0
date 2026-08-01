import { apiRequest } from './client'
import type { UserRole } from '@/auth/session'

export type ApiUser = {
  id: string
  username: string
  email: string
  full_name: string | null
  role: UserRole
  is_active: boolean
  is_verified: boolean
  created_at: string
  updated_at: string | null
  last_login: string | null
}

// Tokens are stored in HttpOnly cookies by the backend; the JSON body
// carries only the user identity so the client can render the right
// dashboard without an extra /auth/me round-trip.
export type LoginResponse = {
  user: ApiUser
}

export type SignupPayload = {
  username: string
  email: string
  password: string
  full_name?: string
  role?: UserRole
}

export type RefreshResponse = { user: ApiUser }

/**
 * POST /api/auth/login
 * Returns access + (optional) refresh tokens plus the authenticated user.
 */
export function login(email: string, password: string) {
  return apiRequest<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
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

export function createAdmin(payload: AdminCreatePayload) {
  return apiRequest<ApiUser>('/api/auth/admin', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/**
 * @deprecated Use {@link signup} instead — kept as an alias to avoid breaking
 * any legacy imports during the migration.
 */
export const register = signup
