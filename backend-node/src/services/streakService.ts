/**
 * Learning-streak bookkeeping — mirrors backend/app/services/streak_service.py.
 *
 * A "learning day" is recorded when the student completes a lesson (or makes
 * ≥50% progress on one). The streak counts consecutive learning days ending
 * today (or yesterday while today is still pending). Restores let the student
 * back-fill a skipped day, limited per calendar month.
 */
import { config } from "../config.js";
import { db } from "../db.js";
import type { Row } from "../db.js";

export interface LearningDayRow extends Row {
  id: string;
  user_id: string;
  day: string; // YYYY-MM-DD
  is_restored: boolean;
  restored_at: string | null;
  created_at: string;
}

function utcDateStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function monthStartStr(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

export async function recordLearningDay(userId: string, day?: string): Promise<void> {
  const target = day ?? utcDateStr();
  const existing = await db.get<LearningDayRow>(
    `SELECT * FROM learning_days WHERE user_id = $1 AND day = $2`,
    [userId, target]
  );
  if (existing) return;
  await db.query(
    `INSERT INTO learning_days (id, user_id, day, is_restored, restored_at, created_at)
     VALUES ($1,$2,$3,FALSE,NULL,$4)`,
    [crypto.randomUUID(), userId, target, new Date().toISOString()]
  );
}

async function loadRows(userId: string): Promise<LearningDayRow[]> {
  return db.query<LearningDayRow>(`SELECT * FROM learning_days WHERE user_id = $1`, [userId]);
}

function currentStreak(learned: Set<string>, today: string): number {
  const todayMs = Date.parse(`${today}T00:00:00Z`);
  const fmt = (ms: number) => new Date(ms).toISOString().slice(0, 10);
  let anchor = today;
  if (!learned.has(today)) {
    const yest = fmt(todayMs - 86_400_000);
    if (learned.has(yest)) anchor = yest;
    else return 0;
  }
  let streak = 0;
  let d = Date.parse(`${anchor}T00:00:00Z`);
  while (learned.has(fmt(d))) {
    streak += 1;
    d -= 86_400_000;
  }
  return streak;
}

function longestStreak(learned: Set<string>): number {
  if (learned.size === 0) return 0;
  const days = [...learned].sort();
  let best = 0;
  let current = 0;
  let prevMs = 0;
  for (const d of days) {
    const ms = Date.parse(`${d}T00:00:00Z`);
    current = prevMs !== 0 && ms - prevMs === 86_400_000 ? current + 1 : 1;
    best = Math.max(best, current);
    prevMs = ms;
  }
  return best;
}

function restorableDay(learned: Set<string>, today: string): string | null {
  const todayMs = Date.parse(`${today}T00:00:00Z`);
  const fmt = (ms: number) => new Date(ms).toISOString().slice(0, 10);
  for (let offset = 1; offset <= 8; offset++) {
    const d = todayMs - offset * 86_400_000;
    const day = fmt(d);
    if (learned.has(day)) continue;
    const prev = fmt(d - 86_400_000);
    if (learned.has(prev)) return day;
  }
  return null;
}

function restoresUsedThisMonth(rows: LearningDayRow[]): number {
  const month = monthStartStr(new Date());
  return rows.filter(
    (row) => row.is_restored && row.restored_at && row.restored_at.slice(0, 10) >= month
  ).length;
}

export async function getStreak(userId: string): Promise<Record<string, unknown>> {
  const rows = await loadRows(userId);
  const learned = new Set(rows.map((r) => r.day));
  const today = utcDateStr();
  const restorable = restorableDay(learned, today);
  const restoresUsed = restoresUsedThisMonth(rows);
  const maxRestores = config.MAX_STREAK_RESTORES_PER_MONTH;
  const last = learned.size ? [...learned].sort().pop()! : null;
  const month = monthStartStr(new Date());

  return {
    current_streak: currentStreak(learned, today),
    longest_streak: longestStreak(learned),
    last_learning_day: last,
    learned_today: learned.has(today),
    days_this_month: rows.filter((r) => r.day >= month).length,
    restores_used: restoresUsed,
    restores_available: Math.max(0, maxRestores - restoresUsed),
    max_restores_per_month: maxRestores,
    restorable_day: restorable,
    restore_eligible: restorable !== null && maxRestores - restoresUsed > 0,
  };
}

/** Back-fill the most recent skipped day. Returns (streak, error|null). */
export async function restoreSkippedDay(
  userId: string
): Promise<[Record<string, unknown>, string | null]> {
  const rows = await loadRows(userId);
  const learned = new Set(rows.map((r) => r.day));
  const today = utcDateStr();
  const restorable = restorableDay(learned, today);
  const maxRestores = config.MAX_STREAK_RESTORES_PER_MONTH;
  const restoresUsed = restoresUsedThisMonth(rows);

  if (!restorable) return [await getStreak(userId), "No skipped day to restore."];
  if (restoresUsed >= maxRestores) {
    return [await getStreak(userId), "All restores for this month are used up."];
  }

  await db.query(
    `INSERT INTO learning_days (id, user_id, day, is_restored, restored_at, created_at)
     VALUES ($1,$2,$3,TRUE,$4,$4)`,
    [crypto.randomUUID(), userId, restorable, new Date().toISOString()]
  );
  return [await getStreak(userId), null];
}