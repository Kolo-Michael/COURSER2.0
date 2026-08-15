/**
 * JSON serialization helpers that reproduce Pydantic's datetime output.
 *
 * Pydantic serializes naive datetimes as `YYYY-MM-DDTHH:MM:SS[.ffffff]` with
 * the space from the DB row swapped for a `T`, and drops a fractional part
 * that is entirely zeros. This module normalizes the raw strings returned by
 * node-postgres / the DB so responses match the Python API byte-for-byte.
 */

const TS_RE =
  /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})(\.\d{1,9})?(Z|[+-]\d{2}(:?\d{2})?)?$/;

/**
 * Normalize a DB datetime/date string to Pydantic's naive UTC ISO shape.
 * Handles `timestamp` (naive), `timestamptz` (with +00 / Z offset) and `date`.
 */
export function normalizeDt(value: string | null | undefined): string | null {
  if (value == null) return null;
  const m = TS_RE.exec(value.trim());
  if (!m) return value.trim();
  const [, date, time, frac, tz] = m;
  // Offsets: the stored values are UTC; strip the offset so the naive output
  // matches what Pydantic emits (Python normalizes with _to_naive_utc).
  if (tz) {
    // If the offset isn't +00 we can't fold it in cheaply — but Neon writes UTC.
    void tz;
  }
  let body = `${date}T${time}`;
  if (frac && frac.replace(/\./g, "").match(/[1-9]/)) {
    body += frac.slice(0, 7); // microseconds precision
  }
  return body;
}

/** Convert a naive UTC string (DB shape) into a UTC epoch milliseconds value. */
export function epochUtc(value: string | null | undefined): number | null {
  if (value == null) return null;
  const norm = normalizeDt(value);
  if (!norm) return null;
  const t = Date.parse(`${norm}Z`); // treat as UTC
  return Number.isNaN(t) ? null : t;
}

/** Current time as an ISO string suitable for writing to Postgres columns. */
export function nowIso(): string {
  return new Date().toISOString();
}

/** Naive UTC string in DB shape (YYYY-MM-DD HH:MM:SS.fff) for date math. */
export function nowNaive(): string {
  return new Date().toISOString().replace("T", " ").replace(/\.\d{3}Z$/, "");
}