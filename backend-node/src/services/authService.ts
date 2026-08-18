/**
 * User persistence, authentication, and session bookkeeping.
 *
 * Mirrors backend/app/services/auth_service.py. All queries are raw SQL
 * against the existing schema (users, user_sessions, password_reset_tokens);
 * hashing/token logic lives in src/security.ts.
 */
import { randomUUID } from "node:crypto";

import { config } from "../config.js";
import { db } from "../db.js";
import { createAccessToken, createRefreshToken, decodeToken, hashPassword, verifyPassword } from "../security.js";
import { epochUtc, nowIso, nowNaive } from "../serialize.js";
import { generateResetCode, sendPasswordResetEmail } from "./emailService.js";
import { verifyEmailDeliverability } from "./verifaliaService.js";

export interface UserRow {
  id: string;
  username: string;
  email: string;
  hashed_password: string;
  full_name: string | null;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
  last_login: string | null;
  failed_login_attempts: number;
  locked_until: string | null;
  avatar_url: string | null;
  nav_style: string;
  nav_collapsed: boolean;
}

export interface SessionRow {
  id: string;
  user_id: string;
  refresh_token: string;
  expires_at: string;
  is_revoked: boolean;
  created_at: string;
  last_used: string;
}

export interface ResetTokenRow {
  id: string;
  user_id: string;
  code: string;
  attempts: number;
  expires_at: string;
  created_at: string;
}

export interface VerificationRow {
  id: string;
  user_id: string;
  code: string;
  attempts: number;
  expires_at: string;
  created_at: string;
}

/** Look a user up by email first, then by exact username. */
export async function getUserByIdentifier(identifier: string): Promise<UserRow | null> {
  const trimmed = identifier.trim();
  const user = await getUserByEmail(trimmed.toLowerCase());
  if (user) return user;
  return db.get<UserRow>(`SELECT * FROM users WHERE username = $1`, [trimmed]);
}

export async function createUser(
  username: string,
  email: string,
  password: string,
  opts: {
    fullName?: string | null;
    role?: string;
    createdBy?: string | null;
    verified?: boolean;
    avatarUrl?: string | null;
  } = {}
): Promise<UserRow> {
  const id = randomUUID();
  const now = nowIso();
  const role = opts.role ?? "student";
  const createdBy = opts.createdBy ?? null;
  await db.query(
    `INSERT INTO users
       (id, username, email, hashed_password, full_name, role, is_active, is_verified,
        created_by, created_at, updated_at, last_login, failed_login_attempts, locked_until,
        avatar_url, nav_style, nav_collapsed)
     VALUES ($1,$2,$3,$4,$5,$6,TRUE,$7,$8,$9,$9,NULL,0,NULL,$10,'sidebar',FALSE)`,
    [
      id,
      username,
      email,
      hashPassword(password),
      opts.fullName ?? null,
      role,
      opts.verified ? true : false,
      createdBy,
      now,
      opts.avatarUrl ?? null,
    ]
  );
  const user = await getUserById(id);
  if (!user) throw new Error("user insert failed");
  return user;
}

export async function getUserByEmail(email: string): Promise<UserRow | null> {
  return db.get<UserRow>(`SELECT * FROM users WHERE email = $1`, [email]);
}

export async function getUserById(id: string): Promise<UserRow | null> {
  return db.get<UserRow>(`SELECT * FROM users WHERE id = $1`, [id]);
}

async function getSessionByToken(token: string): Promise<SessionRow | null> {
  return db.get<SessionRow>(
    `SELECT * FROM user_sessions WHERE refresh_token = $1 AND is_revoked = FALSE`,
    [token]
  );
}

/** Authenticate by (identifier, password) with brute-force lockout. Returns null on failure. */
export async function authenticateUser(
  identifier: string,
  password: string
): Promise<UserRow | null> {
  const user = await getUserByIdentifier(identifier);
  if (!user) {
    // Constant-time-ish: still run bcrypt against a dummy hash so a timing
    // side-channel can't enumerate which emails exist.
    verifyPassword(password, "$2b$12$" + "x".repeat(53));
    return null;
  }

  const nowEpoch = Date.now();
  const lockedEpoch = epochUtc(user.locked_until);
  if (lockedEpoch !== null && lockedEpoch > nowEpoch) return null;

  if (!verifyPassword(password, user.hashed_password)) {
    const attempts = (user.failed_login_attempts || 0) + 1;
    if (attempts >= config.MAX_FAILED_LOGINS) {
      const lockedUntil = new Date(
        Date.now() + config.LOCKOUT_DURATION_MINUTES * 60_000
      ).toISOString();
      await db.query(
        `UPDATE users SET failed_login_attempts = 0, locked_until = $2 WHERE id = $1`,
        [user.id, lockedUntil]
      );
    } else {
      await db.query(`UPDATE users SET failed_login_attempts = $2 WHERE id = $1`, [
        user.id,
        attempts,
      ]);
    }
    return null;
  }

  await db.query(
    `UPDATE users SET failed_login_attempts = 0, locked_until = NULL, last_login = $2 WHERE id = $1`,
    [user.id, nowIso()]
  );
  return getUserById(user.id);
}

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
  sessionExpiresAt: Date;
}

/** Issue both tokens and persist the refresh-token session row. */
export async function issueTokens(user: UserRow, rememberMe = false): Promise<IssuedTokens> {
  const expireDays = rememberMe ? config.REMEMBER_ME_EXPIRE_DAYS : config.REFRESH_TOKEN_EXPIRE_DAYS;
  const accessToken = createAccessToken(user.id, user.role);
  const refreshToken = createRefreshToken(user.id, user.role, expireDays);
  const sessionExpiresAt = new Date(Date.now() + expireDays * 24 * 60 * 60_000);

  await db.query(
    `INSERT INTO user_sessions (id, user_id, refresh_token, expires_at, is_revoked, created_at, last_used)
     VALUES ($1,$2,$3,$4,FALSE,$5,$5)`,
    [randomUUID(), user.id, refreshToken, sessionExpiresAt.toISOString(), nowIso()]
  );
  return { accessToken, refreshToken, sessionExpiresAt };
}

/**
 * Validate a refresh token, revoke it, and issue a fresh pair.
 * Returns null when the token is missing/revoked/expired.
 */
export async function rotateRefreshToken(
  oldRefreshToken: string
): Promise<(IssuedTokens & { user: UserRow }) | null> {
  let payload: { sub: string; role: string };
  try {
    const p = decodeToken(oldRefreshToken, "refresh");
    payload = { sub: p.sub, role: p.role };
  } catch {
    return null;
  }

  const session = await getSessionByToken(oldRefreshToken);
  if (!session) return null;

  const now = Date.now();
  const expiresAt = epochUtc(session.expires_at);
  const lastUsed = epochUtc(session.last_used);
  const createdAt = epochUtc(session.created_at);
  if (expiresAt === null || expiresAt <= now) return null;
  if (now - (lastUsed ?? now) > config.INACTIVITY_TIMEOUT_MINUTES * 60_000) return null;

  const user = await getUserById(session.user_id);
  if (!user) return null;

  const lifetimeMs = (expiresAt - (createdAt ?? expiresAt)) || config.REFRESH_TOKEN_EXPIRE_DAYS * 86_400_000;
  const newExpiresAt = new Date(now + lifetimeMs);

  await db.query(
    `UPDATE user_sessions SET is_revoked = TRUE, last_used = $2 WHERE id = $1`,
    [session.id, nowIso()]
  );
  const newAccess = createAccessToken(user.id, user.role);
  const newRefresh = createRefreshToken(user.id, user.role, Math.max(1, Math.round(lifetimeMs / 86_400_000)));
  await db.query(
    `INSERT INTO user_sessions (id, user_id, refresh_token, expires_at, is_revoked, created_at, last_used)
     VALUES ($1,$2,$3,$4,FALSE,$5,$5)`,
    [randomUUID(), user.id, newRefresh, newExpiresAt.toISOString(), nowIso()]
  );
  return { accessToken: newAccess, refreshToken: newRefresh, sessionExpiresAt: newExpiresAt, user };
}

/** Mark a refresh-token session revoked. Idempotent. */
export async function revokeSession(refreshToken: string): Promise<boolean> {
  const res = await db.query(
    `UPDATE user_sessions SET is_revoked = TRUE WHERE refresh_token = $1 AND is_revoked = FALSE`,
    [refreshToken]
  );
  return (res as unknown as { rowCount: number }).rowCount > 0;
}

// --- password reset -------------------------------------------------------

export async function requestPasswordReset(email: string): Promise<boolean> {
  const user = await getUserByEmail(email);
  if (!user) return true; // never reveal whether the email exists

  // Check deliverability via Verifalia before spending a reset code on a dead
  // mailbox. `null` (unconfigured / API failure) means "unknown" → proceed, so
  // a Verifalia outage can never block a legitimate reset.
  const verifalia = await verifyEmailDeliverability(email);
  if (verifalia && verifalia.classification === "Undeliverable") {
    console.warn(`Verifalia: skipping reset for undeliverable address ${email}`);
    return true; // same generic response — don't leak the classification
  }

  await db.query(`DELETE FROM password_reset_tokens WHERE user_id = $1`, [user.id]);
  const code = generateResetCode();
  const expiresAt = new Date(Date.now() + 15 * 60_000).toISOString();
  await db.query(
    `INSERT INTO password_reset_tokens (id, user_id, code, attempts, expires_at, created_at)
     VALUES ($1,$2,$3,0,$4,$5)`,
    [randomUUID(), user.id, code, expiresAt, nowIso()]
  );
  await sendPasswordResetEmail(email, code);
  return true;
}

export async function verifyResetCode(email: string, code: string): Promise<[boolean, string]> {
  const user = await getUserByEmail(email);
  if (!user) return [false, "Invalid code."];

  const token = await db.get<ResetTokenRow>(
    `SELECT * FROM password_reset_tokens WHERE user_id = $1 AND expires_at > $2 ORDER BY created_at DESC LIMIT 1`,
    [user.id, nowNaive()]
  );
  if (!token) return [false, "Code expired or not found. Please request a new one."];

  if (token.code !== code) {
    const attempts = (token.attempts || 0) + 1;
    if (attempts >= 3) {
      await db.query(`DELETE FROM password_reset_tokens WHERE id = $1`, [token.id]);
      return [false, "Too many failed attempts. Please request a new code."];
    }
    await db.query(`UPDATE password_reset_tokens SET attempts = $2 WHERE id = $1`, [
      token.id,
      attempts,
    ]);
    return [false, `Invalid code. ${3 - attempts} attempts remaining.`];
  }
  return [true, "Code verified successfully."];
}

export async function resetPassword(
  email: string,
  code: string,
  newPassword: string
): Promise<[boolean, string]> {
  const user = await getUserByEmail(email);
  if (!user) return [false, "Invalid request."];

  const token = await db.get<ResetTokenRow>(
    `SELECT * FROM password_reset_tokens WHERE user_id = $1 AND expires_at > $2 ORDER BY created_at DESC LIMIT 1`,
    [user.id, nowNaive()]
  );
  if (!token) return [false, "Code expired or not found. Please request a new one."];
  if (token.code !== code) return [false, "Invalid code."];

  await db.query(
    `UPDATE users SET hashed_password = $2, failed_login_attempts = 0, locked_until = NULL WHERE id = $1`,
    [user.id, hashPassword(newPassword)]
  );
  await db.query(`DELETE FROM password_reset_tokens WHERE id = $1`, [token.id]);
  return [true, "Password reset successfully."];
}

// --- email verification ---------------------------------------------------