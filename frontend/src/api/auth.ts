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

export type AuthTokens = {
  access_token: string
  refresh_token?: string
  token_type: string
}

export type LoginResponse = AuthTokens & {
  user: ApiUser
}

export type SignupPayload = {
  username: string
  email: string
  password: string
  full_name?: string
  role?: UserRole
}

export type RefreshResponse = AuthTokens

/**
 * POST /auth/login
 * Returns access + (optional) refresh tokens plus the authenticated user.
 */
export function login(email: string, password: string) {
  return apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

/**
 * POST /auth/signup
 * Registers a new user and returns access + (optional) refresh tokens plus the new user.
 */
export function signup(payload: SignupPayload) {
  return apiRequest<LoginResponse>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/**
 * POST /auth/refresh
 * Exchange a refresh token for a new access token.
 * Wired in here so the auth layer is ready when the API ships refresh support.
 */
export function refresh(refreshToken: string) {
  return apiRequest<RefreshResponse>('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: refreshToken }),
  })
}

/**
 * @deprecated Use {@link signup} instead — kept as an alias to avoid breaking
 * any legacy imports during the migration.
 */
export const register = signup
