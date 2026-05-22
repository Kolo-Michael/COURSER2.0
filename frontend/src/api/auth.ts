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

export type LoginResponse = {
  access_token: string
  token_type: string
  user: ApiUser
}

export type RegisterPayload = {
  username: string
  email: string
  password: string
  full_name?: string
  role?: UserRole
}

export function login(email: string, password: string) {
  return apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function register(payload: RegisterPayload) {
  return apiRequest<ApiUser>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
