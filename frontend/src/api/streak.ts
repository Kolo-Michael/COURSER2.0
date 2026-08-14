// ─── streak.ts : learning-streak API ────────────────────────────────────
// Wrappers for the daily-streak endpoints: fetch current streak stats and
// restore a missed day using a monthly "freeze" budget.
import { apiRequest } from './client'

/** Streak summary returned by the backend. */
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

/** GET /api/streak — current streak, history, and restore availability. */
export function getStreak() {
  return apiRequest<ApiStreak>('/api/streak')
}

/** POST /api/streak/restore — revive the most recent missed learning day. */
export function restoreStreakDay() {
  return apiRequest<ApiStreak>('/api/streak/restore', {
    method: 'POST',
  })
}
