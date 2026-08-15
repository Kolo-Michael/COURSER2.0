/**
 * PostgreSQL connection pool + tiny query helpers.
 *
 * Mirrors backend/app/core/database.py. Date/timestamp columns are returned
 * as raw strings (type parsers are overridden) so serialization matches the
 * Python/Pydantic output exactly. A pool is fine here because the Node app
 * runs as a long-lived process (uvicorn-on-Render equivalent).
 */
import pg from "pg";

import { config } from "./config.js";

// Keep date/time values as raw strings rather than JS Date objects.
pg.types.setTypeParser(1082, (v) => v); // date
pg.types.setTypeParser(1114, (v) => v); // timestamp without time zone
pg.types.setTypeParser(1184, (v) => v); // timestamptz

export const pool = new pg.Pool({
  connectionString: config.DATABASE_URL,
  ssl: config.DATABASE_SSL ? { rejectUnauthorized: false } : undefined,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 60_000,
});

pool.on("error", (err) => {
  console.error("pg pool error", err);
});

export interface Row {
  [key: string]: unknown;
}

async function query<T = Row>(text: string, params: unknown[] = []): Promise<T[]> {
  if (config.DEBUG_SQL) console.log("[SQL]", text, params);
  const result = await pool.query(text, params);
  return result.rows as T[];
}

async function get<T = Row>(text: string, params: unknown[] = []): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

export const db = { query, get };

/** Best-effort connectivity check used at boot (never fails the process). */
export async function pingDatabase(): Promise<boolean> {
  try {
    const row = await get<{ ok: number }>("SELECT 1 AS ok");
    return row?.ok === 1;
  } catch (err) {
    console.warn("Database unreachable at boot:", err instanceof Error ? err.message : err);
    return false;
  }
}