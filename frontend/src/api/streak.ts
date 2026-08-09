import { apiRequest } from './client'

export type ApiStreak = {
  current_streak: number
  longest_streak: number
  last_learning_day: string | null
  learned_today: boolean
  days_this_month: number
  restores_used: number
  restores_available: number
  max_restores_per_month: number
  restorable_day: string | null
  restore_eligible: boolean
}

export function getStreak() {
  return apiRequest<ApiStreak>('/api/streak')
}

export function restoreStreakDay() {
  return apiRequest<ApiStreak>('/api/streak/restore', {
    method: 'POST',
  })
}
