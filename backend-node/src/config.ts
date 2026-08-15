/**
 * Application configuration — mirrors backend/app/core/config.py.
 *
 * Loads `.env` then `.env.local` (override priority) into process.env and
 * exposes a typed Settings object with the same defaults and semantics as the
 * Python original, including DATABASE_URL normalization and SSL detection for
 * Neon.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

function loadEnvFile(path: string, override: boolean): void {
  if (!existsSync(path)) return;
  const text = readFileSync(path, "utf-8");
  for (const line of text.split("\n")) {
    const value = line.trim();
    if (!value || value.startsWith("#") || !value.includes("=")) continue;
    const eq = value.indexOf("=");
    const key = value.slice(0, eq).trim();
    let raw = value.slice(eq + 1).trim();
    if (
      (raw.startsWith('"') && raw.endsWith('"')) ||
      (raw.startsWith("'") && raw.endsWith("'"))
    ) {
      raw = raw.slice(1, -1);
    }
    if (override) process.env[key] = raw;
    else if (process.env[key] === undefined) process.env[key] = raw;
  }
}

function loadEnvFiles(): void {
  // The .env files live in the backend/ sibling for now; support both a
  // local .env.local in backend-node/ and the shared backend/ ones.
  const here = new URL(".", import.meta.url).pathname;
  const root = process.cwd();
  const candidates = [
    join(root, ".env"),
    join(root, ".env.local"),
    join(root, "..", "backend", ".env"),
    join(root, "..", "backend", ".env.local"),
  ];
  for (const c of candidates) loadEnvFile(c, false);
  // .env.local always wins over .env (loaded with override).
  const localCandidates = [
    join(root, ".env.local"),
    join(root, "..", "backend", ".env.local"),
  ];
  for (const c of localCandidates) loadEnvFile(c, true);
}

loadEnvFiles();

function normalizeDatabaseUrl(url: string): string {
  // pg understands postgres://; swap the postgresql:// prefix.
  if (url.startsWith("postgresql://")) url = url.replace(/^postgresql:\/\//, "postgres://");
  return url;
}

function databaseRequiresSsl(url: string): boolean {
  return url.includes("sslmode=require") || url.includes("neon.tech");
}

const DATABASE_URL_RAW =
  process.env.DATABASE_URL ||
  "postgresql://user:password@localhost:5432/courser";
const DATABASE_URL = normalizeDatabaseUrl(DATABASE_URL_RAW);
const DATABASE_SSL = databaseRequiresSsl(DATABASE_URL_RAW);

export const config = {
  SECRET_KEY: process.env.SECRET_KEY || "your-secret-key-change-in-production",
  ALGORITHM: "HS256" as const,
  ACCESS_TOKEN_EXPIRE_MINUTES: 60,
  REFRESH_TOKEN_EXPIRE_DAYS: 7,
  REMEMBER_ME_EXPIRE_DAYS: 30,
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS || "12", 10),
  MAX_FAILED_LOGINS: 5,
  LOCKOUT_DURATION_MINUTES: 15,
  MAX_STREAK_RESTORES_PER_MONTH: parseInt(
    process.env.MAX_STREAK_RESTORES_PER_MONTH || "4",
    10
  ),
  INACTIVITY_TIMEOUT_MINUTES: parseInt(
    process.env.INACTIVITY_TIMEOUT_MINUTES || "4320",
    10
  ),
  DEBUG_SQL: (process.env.DEBUG_SQL || "false").toLowerCase() === "true",
  DATABASE_URL,
  DATABASE_SSL,
  APP_ENV: process.env.APP_ENV || "production",
  FRONTEND_ORIGINS: process.env.FRONTEND_ORIGINS || "https://courser2.vercel.app",
  FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN,
  API_ORIGIN: process.env.API_ORIGIN || "https://courser2.vercel.app",
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
  OPENAI_BASE_URL: (process.env.OPENAI_BASE_URL || "https://api.groq.com/openai/v1").replace(
    /\/+$/,
    ""
  ),
  OPENAI_MODEL: process.env.OPENAI_MODEL || "llama-3.3-70b-versatile",
} as const;

/** True when running in development (disables Secure cookie flag + real SMTP). */
export function isDev(): boolean {
  return config.APP_ENV !== "production";
}