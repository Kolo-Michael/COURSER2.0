/**
 * Database initializer — Node port of backend/init_db.py (schema + the
 * idempotent ALTERs from the migrate_*.py one-shots).
 *
 * Usage:
 *   npm run init:db          # create missing tables + apply migrations
 *   npm run init:db --reset  # DROP all tables first (destructive — dev only)
 */
import { pool } from "../db.js";
import { CREATE_TABLES, DROP_TABLES, MIGRATIONS } from "./schema.js";

async function run(sql: string): Promise<void> {
  try {
    await pool.query(sql);
  } catch (err) {
    throw new Error(`Statement failed:\n${sql}\n  → ${err instanceof Error ? err.message : err}`);
  }
}

async function initDb(reset: boolean): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    if (reset) {
      console.log("reset: dropping all tables…");
      for (const table of DROP_TABLES) {
        await client.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
      }
    }
    for (const stmt of CREATE_TABLES) await client.query(stmt);
    for (const stmt of MIGRATIONS) await client.query(stmt);
    await client.query("COMMIT");
    console.log("Database tables created / verified successfully!");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

const reset = process.argv.includes("--reset");
initDb(reset).catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});